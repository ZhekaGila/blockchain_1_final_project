window.AC = window.AC || {};

AC.renderProfile = async () => {
  await AC.refreshBalances();

  AC.setPage("Profile", "Blockchain CV: wallet + courses + certificates.");

  const my = AC.getMyCourses();
  const certs = AC.getCerts();
  const completed = my.filter(x => (x.progress ?? 0) >= 1).length;
  const mock = localStorage.getItem(AC.LS.mock) === "1";
  const bonus = AC.state?.balances?.bonus;
  const bonusText = bonus ? `${Number(bonus.formatted).toFixed(2)} ${bonus.symbol}` : "—";


  const netName = AC.state.network
    ? (AC.TESTNETS[Number(AC.state.network.chainId)] || ("Chain "+Number(AC.state.network.chainId)))
    : "—";

  document.getElementById("page").innerHTML = `
    <div class="grid">
      <div class="card block col7">
        <div class="h2">Wallet</div>
        <div class="muted">
          <b>Address:</b> <span class="mono">${AC.state.account || "—"}</span><br/>
          <b>Network:</b> <span class="mono">${netName}</span><br/>
          <b>Bonus balance:</b> <span class="mono">${bonusText}</span><br/>
          <b>Mode:</b> ${mock ? `<span class="tag warn">Mock</span>` : `<span class="tag ok">Real</span>`}
        </div>

        <div class="rowBtns">
          <button class="btnPrimary" onclick="location.hash='#/courses'">Browse courses</button>
          <button onclick="location.hash='#/certificates'">View certificates</button>
          <button onclick="location.hash='#/course'">Open course page</button>
        </div>

        <div class="muted" style="margin-top:10px;font-size:12px">
          Employer can verify certificates here (real version: on-chain verification).
        </div>
      </div>

      <div class="card block col5">
        <div class="h2">Summary</div>
        <div class="tag">purchased: <b>${my.length}</b></div>
        <div class="tag ok">completed: <b>${completed}</b></div>
        <div class="tag warn">certificates: <b>${certs.length}</b></div>
      </div>

      <div class="card block col12">
        <div class="h2">How to open pages</div>
        <div class="muted">
          Use left navigation or URL hash:
          <span class="mono">#/courses</span>,
          <span class="mono">#/course</span>,
          <span class="mono">#/my-courses</span>,
          <span class="mono">#/certificates</span>,
          <span class="mono">#/profile</span>
        </div>
      </div>
    </div>
  `;
};
