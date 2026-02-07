window.AC = window.AC || {};

AC.routes = {
  "/courses": () => AC.renderCourses(),
  "/course": () => AC.renderCourse(),
  "/my-courses": () => AC.renderMyCourses(),
  "/certificates": () => AC.renderCertificates(),
  "/profile": () => AC.renderProfile()
};

AC.navigate = () => {
  const hash = location.hash || "#/courses";
  const path = hash.replace("#", "");
  const fn = AC.routes[path] || AC.routes["/courses"];
  AC.setActiveNav(path);
  fn();
};

window.addEventListener("hashchange", () => AC.navigate());
