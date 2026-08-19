import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { useTasks, type FamilyWorkspace, type TaskState } from "@/lib/tasks-context";
import { trpc } from "@/lib/trpc";

export default function FamilySyncScreen() {
  const colors = useColors();
  const { user, isAuthenticated, loading, refresh } = useAuth();
  const { exportBackup, restoreBackup, addFamilyFolder, exportFamilyWorkspace, importFamilyWorkspace } = useTasks();
  const [familyTitle, setFamilyTitle] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>();

  const personal = trpc.sync.personal.load.useQuery(undefined, { enabled: isAuthenticated });
  const families = trpc.sync.families.list.useQuery(undefined, { enabled: isAuthenticated });
  const familyDocument = trpc.sync.families.load.useQuery({ familyId: selectedFamilyId ?? "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(selectedFamilyId) && isAuthenticated });
  const members = trpc.sync.families.members.useQuery({ familyId: selectedFamilyId ?? "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(selectedFamilyId) && isAuthenticated });
  const savePersonal = trpc.sync.personal.save.useMutation();
  const createFamily = trpc.sync.families.create.useMutation();
  const joinFamily = trpc.sync.families.join.useMutation();
  const saveFamily = trpc.sync.families.save.useMutation();
  const removeMember = trpc.sync.families.removeMember.useMutation();

  const selectedFamily = useMemo(() => families.data?.find((family) => family.id === selectedFamilyId), [families.data, selectedFamilyId]);
  const alertError = (error: unknown) => Alert.alert("Синхронизация", error instanceof Error ? error.message : "Не удалось выполнить действие.");

  const uploadPersonal = async () => {
    try { await savePersonal.mutateAsync({ payload: JSON.stringify(exportBackup()), revision: personal.data?.revision ?? 0 }); await personal.refetch(); Alert.alert("Синхронизация", "Данные отправлены в ваше облако."); } catch (error) { alertError(error); }
  };
  const downloadPersonal = () => {
    try {
      if (!personal.data?.payload) return;
      const backup = JSON.parse(personal.data.payload) as ReturnType<typeof exportBackup>;
      if (!restoreBackup(backup)) throw new Error("Резервная копия не поддерживается.");
      Alert.alert("Синхронизация", "Данные с другого устройства загружены.");
    } catch (error) { alertError(error); }
  };
  const createSpace = async () => {
    try { const family = await createFamily.mutateAsync({ title: familyTitle.trim() || "Семья" }); setFamilyTitle(""); await families.refetch(); setSelectedFamilyId(family.id); Alert.alert("Семейное пространство создано", `Код приглашения: ${family.inviteCode}`); } catch (error) { alertError(error); }
  };
  const joinSpace = async () => {
    try { const family = await joinFamily.mutateAsync({ inviteCode: inviteCode.trim() }); setInviteCode(""); await families.refetch(); setSelectedFamilyId(family.id); Alert.alert("Готово", `Вы присоединились к пространству «${family.title}".`); } catch (error) { alertError(error); }
  };
  const uploadFamily = async () => {
    if (!selectedFamilyId) return;
    try { const workspace = exportFamilyWorkspace(selectedFamilyId); await saveFamily.mutateAsync({ familyId: selectedFamilyId, payload: JSON.stringify(workspace), revision: familyDocument.data?.revision ?? 0 }); await familyDocument.refetch(); Alert.alert("Семейная синхронизация", "Общие папки и задачи обновлены."); } catch (error) { alertError(error); }
  };
  const downloadFamily = () => {
    try { if (!familyDocument.data?.payload) return; const workspace = JSON.parse(familyDocument.data.payload) as FamilyWorkspace; importFamilyWorkspace(workspace); Alert.alert("Семейная синхронизация", "Общие папки и задачи загружены."); } catch (error) { alertError(error); }
  };
  const createSharedFolder = () => {
    if (!selectedFamilyId) return;
    addFamilyFolder(selectedFamilyId, selectedFamily?.title ?? "Семья");
    Alert.alert("Общая папка", "Создана папка семьи. Добавляйте в неё задачи и отправьте изменения в семейное пространство.");
  };
  const removeParticipant = async (userId: number) => {
    if (!selectedFamilyId) return;
    try { await removeMember.mutateAsync({ familyId: selectedFamilyId, userId }); await members.refetch(); Alert.alert("Участник удалён", "Доступ к семейному пространству отозван."); } catch (error) { alertError(error); }
  };

  if (loading) return <ScreenContainer><View style={styles.center}><Text style={{ color: colors.muted }}>Проверяем вход…</Text></View></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={23} color={colors.foreground} /></Pressable><View><Text style={[styles.title, { color: colors.foreground }]}>Синхронизация и семья</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Ваши данные остаются под контролем аккаунта</Text></View></View>
    {!isAuthenticated ? <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="cloud-sync" size={32} color={colors.primary} /><Text style={[styles.cardTitle, { color: colors.foreground }]}>Войдите для синхронизации</Text><Text style={[styles.cardText, { color: colors.muted }]}>Один аккаунт безопасно связывает ваши устройства и семейные пространства.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.primaryText}>Войти в аккаунт</Text></Pressable></View> : <><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.accountRow}><View style={[styles.accountIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialIcons name="person" size={22} color={colors.primary} /></View><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{user?.name || "Ваш аккаунт"}</Text><Text style={[styles.cardText, { color: colors.muted }]}>{user?.email || "Синхронизация нескольких устройств"}</Text></View></View><View style={styles.actions}><Pressable onPress={() => void uploadPersonal()} style={({ pressed }) => [styles.secondary, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="cloud-upload" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Отправить</Text></Pressable><Pressable onPress={downloadPersonal} style={({ pressed }) => [styles.secondary, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="cloud-download" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Загрузить</Text></Pressable></View></View>
      <Text style={[styles.section, { color: colors.muted }]}>СЕМЕЙНЫЕ ПРОСТРАНСТВА</Text><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput value={familyTitle} onChangeText={setFamilyTitle} placeholder="Название семьи" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><Pressable onPress={() => void createSpace()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.primaryText}>Создать семейное пространство</Text></Pressable><TextInput value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" placeholder="Код приглашения" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><Pressable onPress={() => void joinSpace()} style={({ pressed }) => [styles.secondary, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="group-add" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Присоединиться по коду</Text></Pressable></View>
      {(families.data ?? []).map((family) => <Pressable key={family.id} onPress={() => setSelectedFamilyId(family.id)} style={({ pressed }) => [styles.familyCard, { backgroundColor: selectedFamilyId === family.id ? `${colors.primary}12` : colors.surface, borderColor: selectedFamilyId === family.id ? colors.primary : colors.border }, pressed && styles.pressed]}><MaterialIcons name="family-restroom" size={23} color={colors.primary} /><View style={styles.familyCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{family.title}</Text><Text style={[styles.cardText, { color: colors.muted }]}>{family.role === "owner" ? `Ваш код: ${family.inviteCode}` : "Участник семьи"}</Text></View>{selectedFamilyId === family.id ? <MaterialIcons name="check" size={20} color={colors.primary} /> : null}</Pressable>)}
      {selectedFamilyId ? <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{selectedFamily?.title}</Text><Text style={[styles.cardText, { color: colors.muted }]}>Общие папки синхронизируются только с участниками этого пространства.</Text><View style={styles.actions}><Pressable onPress={createSharedFolder} style={({ pressed }) => [styles.secondary, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="create-new-folder" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Общая папка</Text></Pressable><Pressable onPress={() => void uploadFamily()} style={({ pressed }) => [styles.secondary, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="upload" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Обновить</Text></Pressable><Pressable onPress={downloadFamily} style={({ pressed }) => [styles.secondary, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="download" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Получить</Text></Pressable></View>{(members.data ?? []).map((member) => <View key={member.userId} style={[styles.memberRow, { borderTopColor: colors.border }]}><MaterialIcons name={member.role === "owner" ? "verified-user" : "person-outline"} size={18} color={member.role === "owner" ? colors.primary : colors.muted} /><View style={styles.familyCopy}><Text style={[styles.memberName, { color: colors.foreground }]}>{member.name || member.email || "Участник"}</Text><Text style={[styles.cardText, { color: colors.muted }]}>{member.role === "owner" ? "Владелец" : "Участник"}</Text></View>{selectedFamily?.role === "owner" && member.userId !== user?.id ? <Pressable onPress={() => void removeParticipant(member.userId)} style={styles.remove}><MaterialIcons name="person-remove" size={19} color={colors.error} /></Pressable> : null}</View>)}</View> : null}</>}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 36 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, header: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 22 }, back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginLeft: -10 }, title: { fontSize: 25, fontWeight: "800", letterSpacing: -0.5 }, subtitle: { marginTop: 3, fontSize: 13 }, card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 17, gap: 12 }, cardTitle: { fontSize: 16, fontWeight: "700" }, cardText: { fontSize: 13, lineHeight: 18 }, primary: { minHeight: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, secondary: { minHeight: 42, flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 10 }, secondaryText: { fontSize: 13, fontWeight: "700" }, pressed: { opacity: 0.72 }, accountRow: { flexDirection: "row", alignItems: "center", gap: 11 }, accountIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, section: { marginTop: 26, marginBottom: 9, fontSize: 11, fontWeight: "800", letterSpacing: 0.9 }, input: { height: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 13, fontSize: 15 }, familyCard: { minHeight: 72, marginTop: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, familyCopy: { flex: 1 }, memberRow: { minHeight: 46, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 9 }, memberName: { fontSize: 14, fontWeight: "700" }, remove: { width: 36, height: 36, alignItems: "center", justifyContent: "center" }, });
