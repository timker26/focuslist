import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { cancelTaskReminder, requestReminderPermission, scheduleTaskReminder } from "@/lib/notifications";
import { isFolderCoverId, type FolderCoverId } from "@/lib/folder-covers";
import { getDefaultFolderEmoji, getDefaultFolderIcon, isFolderIconName, type FolderIconName } from "@/lib/folder-icons";
import { isAppLanguage, type AppLanguage } from "@/lib/languages";
import { translate } from "@/lib/translations";
import { localizeStarterFolders, mergeStarterFolders, starterFolderTemplates } from "@/lib/starter-folders";
import { createBackup, type FocusListBackup } from "@/lib/backup";
import { deleteTaskAttachments } from "@/lib/task-attachment-storage";
import { normalizeTaskAttachments } from "@/lib/task-attachment-utils";
import { defaultPlayReadiness, normalizePlayReadiness, type PlayReadiness } from "@/lib/play-readiness";

const STORAGE_KEY = "focuslist:v1";
const INBOX_LIST_ID = "inbox";

export type ThemeMode = "light" | "dark" | "system";
export type TaskPriority = "none" | "low" | "medium" | "high";
export type TaskRecurrence = "none" | "daily" | "weekly";

export type TaskAttachment = {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
  kind: "image" | "file";
  addedAt: string;
};

export type TaskList = {
  id: string;
  title: string;
  color: string;
  createdAt: string;
  isDefault?: boolean;
};

export type TaskFolder = {
  id: string;
  title: string;
  color: string;
  icon: FolderIconName;
  emoji: string;
  isPinned: boolean;
  coverId: FolderCoverId;
  templates: TaskTemplate[];
  sortOrder: number;
  createdAt: string;
  familyId?: string;
};

export type FamilyWorkspace = {
  familyId: string;
  folders: TaskFolder[];
  tasks: Task[];
  tags: TaskTag[];
  updatedAt: string;
};

export type TaskTemplate = {
  id: string;
  title: string;
  notes: string;
  priority: TaskPriority;
  isImportant: boolean;
  createdAt: string;
};

export type TaskTag = {
  id: string;
  title: string;
  color: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  listId: string;
  dueAt?: string;
  completedAt?: string;
  notificationId?: string;
  folderId?: string;
  tagIds: string[];
  isImportant: boolean;
  isPinned: boolean;
  priority: TaskPriority;
  archivedAt?: string;
  recurrence: TaskRecurrence;
  attachments: TaskAttachment[];
  createdAt: string;
};

export type TaskDraft = Pick<Task, "title" | "notes" | "listId" | "dueAt"> & {
  folderId?: string;
  tagIds?: string[];
  isImportant?: boolean;
  isPinned?: boolean;
  priority?: TaskPriority;
  recurrence?: TaskRecurrence;
  attachments?: TaskAttachment[];
};

export type Settings = {
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  starterFoldersInitialized: boolean;
  hasCompletedOnboarding: boolean;
  language: AppLanguage;
  firstDayOfWeek: 0 | 1;
  playReadiness: PlayReadiness;
};

export type TaskState = {
  tasks: Task[];
  lists: TaskList[];
  folders: TaskFolder[];
  tags: TaskTag[];
  settings: Settings;
};

type TasksContextValue = TaskState & {
  isReady: boolean;
  inboxListId: string;
  addTask: (draft: TaskDraft) => Task;
  updateTask: (id: string, patch: Partial<TaskDraft>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addList: (input: Pick<TaskList, "title" | "color">) => TaskList;
  updateList: (id: string, patch: Partial<Pick<TaskList, "title" | "color">>) => void;
  deleteList: (id: string) => void;
  addFolder: (input: Pick<TaskFolder, "title" | "color"> & Partial<Pick<TaskFolder, "icon" | "emoji" | "isPinned" | "coverId">>) => TaskFolder;
  updateFolder: (id: string, patch: Partial<Pick<TaskFolder, "title" | "color" | "icon" | "emoji" | "isPinned" | "coverId">>) => void;
  deleteFolder: (id: string) => void;
  toggleFolderPinned: (id: string) => void;
  reorderFolders: (folderIds: string[]) => void;
  addFolderTemplate: (folderId: string, input: Omit<TaskTemplate, "id" | "createdAt">) => TaskTemplate | undefined;
  updateFolderTemplate: (folderId: string, templateId: string, patch: Partial<Omit<TaskTemplate, "id" | "createdAt">>) => void;
  deleteFolderTemplate: (folderId: string, templateId: string) => void;
  createTaskFromTemplate: (folderId: string, templateId: string) => Task | undefined;
  addFamilyFolder: (familyId: string, title: string) => TaskFolder;
  exportFamilyWorkspace: (familyId: string) => FamilyWorkspace;
  importFamilyWorkspace: (workspace: FamilyWorkspace) => void;
  addTag: (input: Pick<TaskTag, "title" | "color">) => TaskTag;
  updateTag: (id: string, patch: Partial<Pick<TaskTag, "title" | "color">>) => void;
  deleteTag: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: () => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  exportBackup: () => FocusListBackup<TaskState>;
  restoreBackup: (backup: FocusListBackup<TaskState>) => boolean;
  getList: (id: string) => TaskList | undefined;
  getFolder: (id?: string) => TaskFolder | undefined;
  getTag: (id: string) => TaskTag | undefined;
};

const defaultList: TaskList = {
  id: INBOX_LIST_ID,
  title: "Входящие",
  color: "#4659E8",
  createdAt: "2026-01-01T00:00:00.000Z",
  isDefault: true,
};

const defaultState: TaskState = {
  tasks: [],
  lists: [defaultList],
  folders: starterFolderTemplates,
  tags: [],
  settings: { themeMode: "system", notificationsEnabled: false, starterFoldersInitialized: true, hasCompletedOnboarding: false, language: "ru", firstDayOfWeek: 1, playReadiness: defaultPlayReadiness },
};

const TasksContext = createContext<TasksContextValue | null>(null);

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeState(candidate: Partial<TaskState> | null): TaskState {
  const language = isAppLanguage(candidate?.settings?.language) ? candidate.settings.language : "ru";
  const rawLists = Array.isArray(candidate?.lists) && candidate.lists.length > 0 ? candidate.lists : defaultState.lists;
  const lists = rawLists.map((list) => list.id === INBOX_LIST_ID ? { ...list, title: translate(language, "Входящие") } : list);
  const hasInbox = lists.some((list) => list.id === INBOX_LIST_ID);
  const storedFolders = Array.isArray(candidate?.folders) ? candidate.folders : [];
  const shouldAddStarterFolders = !candidate?.settings?.starterFoldersInitialized;
  const folders = localizeStarterFolders(mergeStarterFolders(storedFolders, shouldAddStarterFolders, language), language)
    .map((folder, index) => ({ ...folder, icon: isFolderIconName(folder.icon) ? folder.icon : getDefaultFolderIcon(folder.title), emoji: folder.emoji?.trim() || getDefaultFolderEmoji(folder.title), isPinned: Boolean(folder.isPinned), coverId: isFolderCoverId(folder.coverId) ? folder.coverId : "ocean", templates: Array.isArray(folder.templates) ? folder.templates : [], sortOrder: Number.isFinite(folder.sortOrder) ? folder.sortOrder : index }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
  const tags = Array.isArray(candidate?.tags) ? candidate.tags : [];
  const tagIds = new Set(tags.map((tag) => tag.id));
  const folderIds = new Set(folders.map((folder) => folder.id));
  return {
    tasks: Array.isArray(candidate?.tasks)
      ? candidate.tasks.map((task) => ({
          ...task,
          folderId: folderIds.has(task.folderId ?? "") ? task.folderId : undefined,
          tagIds: Array.isArray(task.tagIds) ? [...new Set(task.tagIds.filter((id) => tagIds.has(id)))] : [],
          isImportant: Boolean(task.isImportant),
          isPinned: Boolean(task.isPinned),
          priority: task.priority === "high" || task.priority === "medium" || task.priority === "low" ? task.priority : "none",
          recurrence: task.recurrence === "daily" || task.recurrence === "weekly" ? task.recurrence : "none",
          attachments: normalizeTaskAttachments(task.attachments),
          archivedAt: task.completedAt ? task.archivedAt ?? task.completedAt : undefined,
        }))
      : [],
    lists: hasInbox ? lists : [defaultList, ...lists],
    folders,
    tags,
    settings: { ...defaultState.settings, ...candidate?.settings, starterFoldersInitialized: true, hasCompletedOnboarding: candidate?.settings?.hasCompletedOnboarding ?? Boolean(candidate), language, firstDayOfWeek: candidate?.settings?.firstDayOfWeek === 0 ? 0 : 1, playReadiness: normalizePlayReadiness(candidate?.settings?.playReadiness) },
  };
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TaskState>(defaultState);
  const [isReady, setIsReady] = useState(false);
  const pendingWrite = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        setState(normalizeState(JSON.parse(raw) as Partial<TaskState>));
      })
      .catch(() => {
        // A malformed local cache should never prevent access to the task list.
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (pendingWrite.current) clearTimeout(pendingWrite.current);
    const snapshot = JSON.stringify(state);
    pendingWrite.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, snapshot).catch(() => {
        // The interface remains usable even if a device storage operation fails.
      });
    }, 180);
    return () => { if (pendingWrite.current) clearTimeout(pendingWrite.current); };
  }, [isReady, state]);

  const syncReminder = useCallback(async (task: Task, enabled: boolean) => {
    await cancelTaskReminder(task.notificationId);
    if (!enabled || !task.dueAt || task.completedAt) {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((item) => item.id === task.id ? { ...item, notificationId: undefined } : item),
      }));
      return;
    }
    const notificationId = await scheduleTaskReminder(task, state.settings.language);
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((item) => item.id === task.id ? { ...item, notificationId } : item),
    }));
  }, [state.settings.language]);

  const addTask = useCallback((draft: TaskDraft) => {
    const task: Task = {
      id: newId("task"),
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      listId: draft.listId || INBOX_LIST_ID,
      dueAt: draft.dueAt,
      folderId: draft.folderId,
      tagIds: [...new Set(draft.tagIds ?? [])],
      isImportant: Boolean(draft.isImportant),
      isPinned: Boolean(draft.isPinned),
      priority: draft.priority ?? "none",
      recurrence: draft.recurrence ?? "none",
      attachments: normalizeTaskAttachments(draft.attachments),
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    void syncReminder(task, state.settings.notificationsEnabled);
    return task;
  }, [state.settings.notificationsEnabled, syncReminder]);

  const updateTask = useCallback((id: string, patch: Partial<TaskDraft>) => {
    const original = state.tasks.find((task) => task.id === id);
    if (!original) return;
    const updated: Task = {
      ...original,
      ...patch,
      title: patch.title === undefined ? original.title : patch.title.trim(),
      notes: patch.notes === undefined ? original.notes : patch.notes.trim(),
      tagIds: patch.tagIds === undefined ? original.tagIds : [...new Set(patch.tagIds)],
      isImportant: patch.isImportant === undefined ? original.isImportant : patch.isImportant,
      isPinned: patch.isPinned === undefined ? original.isPinned : patch.isPinned,
      priority: patch.priority === undefined ? original.priority : patch.priority,
      recurrence: patch.recurrence === undefined ? original.recurrence : patch.recurrence,
      attachments: patch.attachments === undefined ? original.attachments : normalizeTaskAttachments(patch.attachments),
    };
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id ? updated : task,
      ),
    }));
    void syncReminder(updated, state.settings.notificationsEnabled);
  }, [state.settings.notificationsEnabled, state.tasks, syncReminder]);

  const toggleTask = useCallback((id: string) => {
    const original = state.tasks.find((task) => task.id === id);
    if (!original) return;
    const timestamp = new Date().toISOString();
    const updated = original.completedAt ? { ...original, completedAt: undefined, archivedAt: undefined } : { ...original, completedAt: timestamp, archivedAt: timestamp };
    const nextTask = !original.completedAt && original.recurrence !== "none" ? {
      ...original,
      id: newId("task"),
      dueAt: (() => { const next = original.dueAt ? new Date(original.dueAt) : new Date(); next.setDate(next.getDate() + (original.recurrence === "daily" ? 1 : 7)); return next.toISOString(); })(),
      completedAt: undefined,
      archivedAt: undefined,
      notificationId: undefined,
      attachments: [],
      createdAt: timestamp,
    } : undefined;
    setState((current) => ({
      ...current,
      tasks: [...current.tasks.map((task) =>
        task.id === id ? updated : task,
      ), ...(nextTask ? [nextTask] : [])],
    }));
    void syncReminder(updated, state.settings.notificationsEnabled);
    if (nextTask) void syncReminder(nextTask, state.settings.notificationsEnabled);
  }, [state.settings.notificationsEnabled, state.tasks, syncReminder]);

  const deleteTask = useCallback((id: string) => {
    const original = state.tasks.find((task) => task.id === id);
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
    void cancelTaskReminder(original?.notificationId);
    if (original?.attachments.length) void deleteTaskAttachments(original.attachments);
  }, [state.tasks]);

  const addList = useCallback((input: Pick<TaskList, "title" | "color">) => {
    const list: TaskList = {
      id: newId("list"),
      title: input.title.trim(),
      color: input.color,
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, lists: [...current.lists, list] }));
    return list;
  }, []);

  const updateList = useCallback((id: string, patch: Partial<Pick<TaskList, "title" | "color">>) => {
    setState((current) => ({
      ...current,
      lists: current.lists.map((list) =>
        list.id === id ? { ...list, ...patch, title: patch.title === undefined ? list.title : patch.title.trim() } : list,
      ),
    }));
  }, []);

  const deleteList = useCallback((id: string) => {
    if (id === INBOX_LIST_ID) return;
    setState((current) => ({
      ...current,
      lists: current.lists.filter((list) => list.id !== id),
      tasks: current.tasks.map((task) => (task.listId === id ? { ...task, listId: INBOX_LIST_ID } : task)),
    }));
  }, []);

  const addFolder = useCallback((input: Pick<TaskFolder, "title" | "color"> & Partial<Pick<TaskFolder, "icon" | "emoji" | "isPinned" | "coverId">>) => {
    const folder: TaskFolder = { id: newId("folder"), title: input.title.trim(), color: input.color, icon: input.icon ?? getDefaultFolderIcon(input.title), emoji: input.emoji?.trim() || getDefaultFolderEmoji(input.title), isPinned: Boolean(input.isPinned), coverId: input.coverId ?? "ocean", templates: [], sortOrder: state.folders.length, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, folders: [...current.folders, folder] }));
    return folder;
  }, [state.folders.length]);

  const updateFolder = useCallback((id: string, patch: Partial<Pick<TaskFolder, "title" | "color" | "icon" | "emoji" | "isPinned" | "coverId">>) => {
    setState((current) => ({
      ...current,
      folders: current.folders.map((folder) => folder.id === id ? { ...folder, ...patch, title: patch.title === undefined ? folder.title : patch.title.trim() } : folder),
    }));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      folders: current.folders.filter((folder) => folder.id !== id),
      tasks: current.tasks.map((task) => task.folderId === id ? { ...task, folderId: undefined } : task),
    }));
  }, []);

  const toggleFolderPinned = useCallback((id: string) => {
    setState((current) => ({ ...current, folders: current.folders.map((folder) => folder.id === id ? { ...folder, isPinned: !folder.isPinned } : folder) }));
  }, []);

  const reorderFolders = useCallback((folderIds: string[]) => {
    setState((current) => {
      const byId = new Map(current.folders.map((folder) => [folder.id, folder]));
      const ordered = folderIds.map((id) => byId.get(id)).filter((folder): folder is TaskFolder => Boolean(folder));
      const remaining = current.folders.filter((folder) => !folderIds.includes(folder.id));
      const pinned = ordered.filter((folder) => folder.isPinned);
      const unpinned = ordered.filter((folder) => !folder.isPinned);
      return { ...current, folders: [...pinned, ...unpinned, ...remaining].map((folder, index) => ({ ...folder, sortOrder: index })) };
    });
  }, []);

  const addFolderTemplate = useCallback((folderId: string, input: Omit<TaskTemplate, "id" | "createdAt">) => {
    const template: TaskTemplate = { id: newId("template"), title: input.title.trim(), notes: input.notes.trim(), priority: input.priority, isImportant: input.isImportant, createdAt: new Date().toISOString() };
    let exists = false;
    setState((current) => ({ ...current, folders: current.folders.map((folder) => { if (folder.id !== folderId) return folder; exists = true; return { ...folder, templates: [...folder.templates, template] }; }) }));
    return exists ? template : undefined;
  }, []);

  const updateFolderTemplate = useCallback((folderId: string, templateId: string, patch: Partial<Omit<TaskTemplate, "id" | "createdAt">>) => {
    setState((current) => ({ ...current, folders: current.folders.map((folder) => folder.id !== folderId ? folder : { ...folder, templates: folder.templates.map((template) => template.id !== templateId ? template : { ...template, ...patch, title: patch.title === undefined ? template.title : patch.title.trim(), notes: patch.notes === undefined ? template.notes : patch.notes.trim() }) }) }));
  }, []);

  const deleteFolderTemplate = useCallback((folderId: string, templateId: string) => {
    setState((current) => ({ ...current, folders: current.folders.map((folder) => folder.id !== folderId ? folder : { ...folder, templates: folder.templates.filter((template) => template.id !== templateId) }) }));
  }, []);

  const createTaskFromTemplate = useCallback((folderId: string, templateId: string) => {
    const template = state.folders.find((folder) => folder.id === folderId)?.templates.find((item) => item.id === templateId);
    if (!template) return undefined;
    return addTask({ title: template.title, notes: template.notes, listId: INBOX_LIST_ID, folderId, isImportant: template.isImportant, priority: template.priority });
  }, [addTask, state.folders]);

  const addFamilyFolder = useCallback((familyId: string, title: string) => {
    const folder: TaskFolder = {
      id: newId("folder"), title: title.trim(), color: "#4659E8", icon: "folder", emoji: "👨‍👩‍👧‍👦", isPinned: false, coverId: "ocean", templates: [], sortOrder: state.folders.length, createdAt: new Date().toISOString(), familyId,
    };
    setState((current) => ({ ...current, folders: [...current.folders, folder] }));
    return folder;
  }, [state.folders.length]);

  const exportFamilyWorkspace = useCallback((familyId: string): FamilyWorkspace => {
    const folders = state.folders.filter((folder) => folder.familyId === familyId);
    const folderIds = new Set(folders.map((folder) => folder.id));
    const tasks = state.tasks.filter((task) => task.folderId && folderIds.has(task.folderId));
    const tagIds = new Set(tasks.flatMap((task) => task.tagIds));
    return { familyId, folders, tasks, tags: state.tags.filter((tag) => tagIds.has(tag.id)), updatedAt: new Date().toISOString() };
  }, [state.folders, state.tags, state.tasks]);

  const importFamilyWorkspace = useCallback((workspace: FamilyWorkspace) => {
    setState((current) => {
      const familyFolderIds = new Set(current.folders.filter((folder) => folder.familyId === workspace.familyId).map((folder) => folder.id));
      const nonFamilyFolders = current.folders.filter((folder) => folder.familyId !== workspace.familyId);
      const nonFamilyTasks = current.tasks.filter((task) => !task.folderId || !familyFolderIds.has(task.folderId));
      const incomingTagIds = new Set(workspace.tags.map((tag) => tag.id));
      return { ...current, folders: [...nonFamilyFolders, ...workspace.folders.map((folder) => ({ ...folder, familyId: workspace.familyId }))], tasks: [...nonFamilyTasks, ...workspace.tasks.map((task) => ({ ...task, attachments: normalizeTaskAttachments(task.attachments) }))], tags: [...current.tags.filter((tag) => !incomingTagIds.has(tag.id)), ...workspace.tags] };
    });
  }, []);

  const addTag = useCallback((input: Pick<TaskTag, "title" | "color">) => {
    const tag: TaskTag = { id: newId("tag"), title: input.title.trim(), color: input.color, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, tags: [...current.tags, tag] }));
    return tag;
  }, []);

  const updateTag = useCallback((id: string, patch: Partial<Pick<TaskTag, "title" | "color">>) => {
    setState((current) => ({
      ...current,
      tags: current.tags.map((tag) => tag.id === id ? { ...tag, ...patch, title: patch.title === undefined ? tag.title : patch.title.trim() } : tag),
    }));
  }, []);

  const deleteTag = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag.id !== id),
      tasks: current.tasks.map((task) => ({ ...task, tagIds: task.tagIds.filter((tagId) => tagId !== id) })),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((current) => {
      const language = isAppLanguage(patch.language) ? patch.language : current.settings.language;
      return { ...current, folders: patch.language ? localizeStarterFolders(current.folders, language) : current.folders, lists: patch.language ? current.lists.map((list) => list.id === INBOX_LIST_ID ? { ...list, title: translate(language, "Входящие") } : list) : current.lists, settings: { ...current.settings, ...patch, language } };
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((current) => ({ ...current, settings: { ...current.settings, hasCompletedOnboarding: true } }));
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && !(await requestReminderPermission())) return false;
    setState((current) => ({ ...current, settings: { ...current.settings, notificationsEnabled: enabled } }));
    state.tasks.forEach((task) => { void syncReminder(task, enabled); });
    return true;
  }, [state.tasks, syncReminder]);

  const exportBackup = useCallback(() => createBackup(state), [state]);
  const restoreBackup = useCallback((backup: FocusListBackup<TaskState>) => {
    if (backup.schemaVersion !== 1 || !backup.state) return false;
    setState(normalizeState(backup.state));
    return true;
  }, []);

  const getList = useCallback((id: string) => state.lists.find((list) => list.id === id), [state.lists]);
  const getFolder = useCallback((id?: string) => state.folders.find((folder) => folder.id === id), [state.folders]);
  const getTag = useCallback((id: string) => state.tags.find((tag) => tag.id === id), [state.tags]);

  const value = useMemo<TasksContextValue>(
    () => ({
      ...state,
      isReady,
      inboxListId: INBOX_LIST_ID,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      addList,
      updateList,
      deleteList,
      addFolder,
      updateFolder,
      deleteFolder,
      toggleFolderPinned,
      reorderFolders,
      addFolderTemplate,
      updateFolderTemplate,
      deleteFolderTemplate,
      createTaskFromTemplate,
      addFamilyFolder,
      exportFamilyWorkspace,
      importFamilyWorkspace,
      addTag,
      updateTag,
      deleteTag,
      updateSettings,
      completeOnboarding,
      setNotificationsEnabled,
      exportBackup,
      restoreBackup,
      getList,
      getFolder,
      getTag,
    }),
    [addFamilyFolder, addFolder, addFolderTemplate, addList, addTag, addTask, completeOnboarding, createTaskFromTemplate, deleteFolder, deleteFolderTemplate, deleteList, deleteTag, deleteTask, exportBackup, exportFamilyWorkspace, getFolder, getList, getTag, importFamilyWorkspace, isReady, reorderFolders, restoreBackup, setNotificationsEnabled, state, toggleFolderPinned, toggleTask, updateFolder, updateFolderTemplate, updateList, updateSettings, updateTag, updateTask],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks must be used within TasksProvider");
  return context;
}
