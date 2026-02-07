window.AC = window.AC || {};

AC.loadJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
};
AC.saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));

AC.getMyCourses = () => AC.loadJSON(AC.LS.myCourses, []);
AC.setMyCourses = (v) => AC.saveJSON(AC.LS.myCourses, v);

AC.getCerts = () => AC.loadJSON(AC.LS.certs, []);
AC.setCerts = (v) => AC.saveJSON(AC.LS.certs, v);

AC.myCourseEntry = (id) => AC.getMyCourses().find(x => x.id === id) || null;
AC.isPurchased = (id) => {
  const x = AC.myCourseEntry(id);
  return Boolean(x && x.purchasedAt);
};
AC.hasCertificate = (courseId) => AC.getCerts().some(c => c.courseId === courseId);
