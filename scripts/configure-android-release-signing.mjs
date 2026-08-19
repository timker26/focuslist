import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const buildGradlePath = resolve("android/app/build.gradle");
const marker = "// FocusList release signing — generated for GitHub Actions";

function findMatchingBrace(source, openingBraceIndex) {
  let depth = 0;
  for (let index = openingBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error("Could not find the end of the Gradle block.");
}

let contents = await readFile(buildGradlePath, "utf8");

if (!contents.includes(marker)) {
  const androidBlock = contents.indexOf("android {");
  const signingConfigs = contents.indexOf("signingConfigs {", androidBlock);
  if (androidBlock < 0 || signingConfigs < 0) {
    throw new Error("The generated Android Gradle file does not contain the expected signing configuration.");
  }

  const signingConfigsOpen = contents.indexOf("{", signingConfigs);
  const signingConfigsClose = findMatchingBrace(contents, signingConfigsOpen);
  const releaseSigningConfig = `
        release {
            if (focuslistHasReleaseSigning) {
                storeFile file(FOCUSLIST_RELEASE_STORE_FILE)
                storePassword System.getenv("FOCUSLIST_RELEASE_STORE_PASSWORD")
                keyAlias System.getenv("FOCUSLIST_RELEASE_KEY_ALIAS")
                keyPassword System.getenv("FOCUSLIST_RELEASE_KEY_PASSWORD")
            }
        }
`;
  contents = `${contents.slice(0, signingConfigsClose)}${releaseSigningConfig}${contents.slice(signingConfigsClose)}`;

  const buildTypes = contents.indexOf("buildTypes {", signingConfigsClose);
  const releaseBuildType = contents.indexOf("release {", buildTypes);
  if (buildTypes < 0 || releaseBuildType < 0) {
    throw new Error("The generated Android Gradle file does not contain the expected release build type.");
  }
  const releaseBuildTypeOpen = contents.indexOf("{", releaseBuildType);
  const releaseBuildTypeClose = findMatchingBrace(contents, releaseBuildTypeOpen);
  const releaseBlock = contents.slice(releaseBuildTypeOpen, releaseBuildTypeClose + 1);
  const debugSigning = "signingConfig signingConfigs.debug";
  if (!releaseBlock.includes(debugSigning)) {
    throw new Error("The generated release build type does not use the expected default debug signing configuration.");
  }
  const signedReleaseBlock = releaseBlock.replace(
    debugSigning,
    `if (focuslistHasReleaseSigning) {
                signingConfig signingConfigs.release
            } else {
                signingConfig signingConfigs.debug
            }`,
  );
  contents = `${contents.slice(0, releaseBuildTypeOpen)}${signedReleaseBlock}${contents.slice(releaseBuildTypeClose + 1)}`;

  const releaseSigningCheck = `
${marker}
def focuslistHasReleaseSigning = project.hasProperty("FOCUSLIST_RELEASE_STORE_FILE") &&
    System.getenv("FOCUSLIST_RELEASE_STORE_PASSWORD") != null &&
    System.getenv("FOCUSLIST_RELEASE_KEY_ALIAS") != null &&
    System.getenv("FOCUSLIST_RELEASE_KEY_PASSWORD") != null

`;
  contents = `${contents.slice(0, androidBlock)}${releaseSigningCheck}${contents.slice(androidBlock)}`;
}

await writeFile(buildGradlePath, contents);
console.log("Configured Android release signing for FocusList.");
