window.AC = window.AC || {};

AC.renderCertificates = () => {
  AC.setPage("My Certificates", "Certificates you claimed after completing courses (demo).");

  const certs = AC.getCerts();
  if(certs.length === 0){
    document.getElementById("page").innerHTML = `
      <div class="card block">
        <div class="h2">No certificates yet</div>
        <div class="muted">Buy a course → reach 100% progress → claim certificate.</div>
        <div class="rowBtns"><button class="btnPrimary" onclick="location.hash='#/my-courses'">My Courses</button></div>
      </div>
    `;
    return;
  }

  const rows = certs.map(c=>{
    const course = AC.COURSES.find(k => k.id === c.courseId);
    return `
      <tr>
        <td><b>${c.title}</b><div class="small">course: ${course?.title || c.courseId}</div></td>
        <td>
          <span class="tag ok">owner: <span class="mono">${AC.shortAddr(c.owner)}</span></span>
          <span class="tag">date: ${c.issuedAt}</span>
        </td>
        <td><span class="tag">proof (demo): <span class="mono">${c.txHashMock.slice(0,10)}…</span></span></td>
      </tr>
    `;
  }).join("");

  document.getElementById("page").innerHTML = `
    <div class="grid">
      <div class="card block col12">
        <table class="table">
          <thead><tr><th>Certificate</th><th>Owner</th><th>Proof</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
};
