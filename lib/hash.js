export function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

export function avatarForName(name, avatars) {
  return avatars.length ? avatars[hashText(name) % avatars.length] : "";
}
