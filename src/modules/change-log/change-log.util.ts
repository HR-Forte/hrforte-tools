// Remove v if it exists in the version
export const removeVFromVersion = (version: string) => {
  return version.replace('v', '');
};
