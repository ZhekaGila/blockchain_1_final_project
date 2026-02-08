window.AC = window.AC || {};

AC.loadJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
};
AC.saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));

AC.myCoursesKey = () => {
  const a = (AC.state?.account || "anon").toLowerCase();
  return `${AC.LS.myCourses}:${a}`;
};

AC.getMyCourses = () => AC.loadJSON(AC.myCoursesKey(), []);
AC.setMyCourses = (v) => AC.saveJSON(AC.myCoursesKey(), v);

AC.certsKey = () => {
  const a = (AC.state?.account || "anon").toLowerCase();
  return `${AC.LS.certs}:${a}`;
};

AC.getCerts = () => AC.loadJSON(AC.certsKey(), []);
AC.setCerts = (v) => AC.saveJSON(AC.certsKey(), v);

AC.hasCertificate = (courseId) => AC.getCerts().some(c => c.courseId === courseId);

AC.syncMyCoursesFromChain = async () => {
  const isMock = localStorage.getItem(AC.LS.mock) === "1";
  if (isMock) return;

  if (!AC.state?.account) return;
  await AC.initContracts();

  const platform = AC.contracts.platform;
  const user = AC.state.account;

  const my = [];

  for (const c of AC.COURSES) {
    const cid = AC.courseIdToBytes32(c.id);

    const [purchased, completed] = await Promise.all([
      platform.purchased(user, cid),
      platform.completed(user, cid),
    ]);

    if (purchased) {
      my.push({
        id: c.id,
        purchasedAt: new Date().toISOString(), 
        progress: completed ? 1 : 0,
        status: completed ? "completed" : "in_progress",
        onchainCompleted: completed,
        txHash: "" 
      });
    }
  }

  AC.setMyCourses(my);
};

AC.resetLocalDemoData = () => {
  try {
    const prefixes = [AC.LS.myCourses + ":", AC.LS.certs + ":"];
    for (const k of Object.keys(localStorage)) {
      if (prefixes.some(p => k.startsWith(p))) {
        localStorage.removeItem(k);
      }
    }
    if (AC.LS?.selectedCourse) localStorage.removeItem(AC.LS.selectedCourse);
  } catch (_) {}
};



AC.myCourseEntry = (id) => AC.getMyCourses().find(x => x.id === id) || null;
AC.isPurchased = (id) => {
  const x = AC.myCourseEntry(id);
  return Boolean(x && x.purchasedAt);
};
