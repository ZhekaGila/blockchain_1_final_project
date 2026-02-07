window.AC = window.AC || {};

AC.renderMyCourses = () => {
  AC.setPage("My Courses", "Purchased courses + progress. Reach 100% to claim a certificate.");

  const my = AC.getMyCourses();
  if(my.length === 0){
    document.getElementById("page").innerHTML = `
      <div class="card block">
        <div class="h2">No courses yet</div>
        <div class="muted">Go to All Courses and purchase a course.</div>
        <div class="rowBtns"><button class="btnPrimary" onclick="location.hash='#/courses'">Open catalog</button></div>
      </div>
    `;
    return;
  }

  const rows = my.map(x=>{
    const c = AC.COURSES.find(k => k.id === x.id);
    const p = x.progress ?? 0;
    const status = (p >= 1) ? `<span class="tag ok">✅ completed</span>` : `<span class="tag warn">⏳ ${AC.percent(p)}</span>`;
    const canClaim = p >= 1 && !AC.hasCertificate(x.id);

    return `
      <tr>
        <td><b>${c?.title || x.id}</b><div class="small">${c?.issuer || ""}</div></td>
        <td>
          <div class="bar"><div style="width:${Math.round(p*100)}%"></div></div>
          <div class="small" style="margin-top:6px">${AC.percent(p)}</div>
        </td>
        <td>${status}</td>
        <td><span class="tag">buy tx: <span class="mono">${(x.txHash||"—").slice(0,10)}…</span></span></td>
        <td>
          <div class="rowBtns">
            <button onclick="AC.openCourse('${x.id}')">Open</button>
            <button class="btnOk" onclick="AC.addProgress('${x.id}', 0.25)">+25%</button>
            ${canClaim ? `<button class="btnPrimary" onclick="AC.claimCertificate('${x.id}')">Claim certificate</button>` : ""}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  document.getElementById("page").innerHTML = `
    <div class="grid">
      <div class="card block col12">
        <table class="table">
          <thead>
            <tr><th>Course</th><th>Progress</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
};
