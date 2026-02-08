window.AC = window.AC || {};

AC.clamp = (n,a,b) => Math.max(a, Math.min(b,n));
AC.percent = (p) => Math.round(p*100) + "%";
AC.shortAddr = (a) => !a ? "—" : a.slice(0,6) + "…" + a.slice(-4);

let toastTimer = null;
AC.toast = (msg) => {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 2800);
};

AC.setActiveNav = (path) => {
  document.querySelectorAll("#nav a").forEach(a=>{
    a.classList.toggle("active", a.dataset.route === path);
  });
};
AC.setPage = (title, sub) => {
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageSub").textContent = sub || "";
};

AC.showAuth = () => {
  document.getElementById("authView").style.display = "grid";
  document.getElementById("appView").style.display = "none";
};
AC.showApp = () => {
  document.getElementById("authView").style.display = "none";
  document.getElementById("appView").style.display = "block";
  if(!location.hash) location.hash = "#/courses";
  AC.navigate();
};

AC.updateWalletUI = () => {
  const { account, network } = AC.state;

  const walletText = document.getElementById("walletText");
  const walletDot = document.getElementById("walletDot");
  const netText = document.getElementById("netText");
  const netDot = document.getElementById("netDot");

  const awt = document.getElementById("authWalletText");
  const awd = document.getElementById("authWalletDot");
  const ant = document.getElementById("authNetText");
  const andd = document.getElementById("authNetDot");
  const sideWallet = document.getElementById("sideWallet");

  if(account){
    const s = AC.shortAddr(account);
    walletText.innerHTML = `Wallet: <span class="mono">${s}</span>`;
    walletDot.className = "dot ok";
    awt.innerHTML = `Wallet: <span class="mono">${s}</span>`;
    awd.className = "dot ok";
    sideWallet.textContent = s;
  }else{
    walletText.textContent = "Wallet: —";
    walletDot.className = "dot";
    awt.textContent = "Wallet: not connected";
    awd.className = "dot";
    sideWallet.textContent = "—";
  }

  if(network){
    const cid = Number(network.chainId);
    const name = AC.TESTNETS[cid] || ("Chain " + cid);
    netText.innerHTML = `Network: <span class="mono">${name}</span>`;
    ant.innerHTML = `Network: <span class="mono">${name}</span>`;
    if(AC.isTestnet(cid)){ netDot.className="dot ok"; andd.className="dot ok"; }
    else{ netDot.className="dot warn"; andd.className="dot warn"; }
  }else{
    netText.textContent = "Network: —";
    netDot.className = "dot";
    ant.textContent = "Network: —";
    andd.className = "dot";
  }

  AC.logTx = function ({ title, status, hash, blockNumber }) {
    const box = document.getElementById("txLog");
    if (!box) return;

    const div = document.createElement("div");
    div.className = "txItem " + (status || "wait");

    div.innerHTML = `
      <b>${title}</b><br/>
      status: <b>${status}</b><br/>
      ${hash ? `tx: <span class="txHash">${hash.slice(0,10)}…</span><br/>` : ""}
      ${blockNumber ? `block: ${blockNumber}` : ""}
    `;

    box.prepend(div);
  };

};
