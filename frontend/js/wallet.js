window.AC = window.AC || {};

AC.state = {
  provider: null,
  signer: null,
  account: null,
  network: null
};

AC.initProvider = async () => {
  if(!window.ethereum) return false;
  AC.state.provider = new ethers.BrowserProvider(window.ethereum);
  return true;
};

AC.connectWallet = async () => {
  localStorage.removeItem(AC.LS.mock);
  const ok = await AC.initProvider();
  if(!ok){
    AC.toast("MetaMask not found. Use Mock Connect to demo the UI.");
    return;
  }
  try{
    await window.ethereum.request({ method: "eth_requestAccounts" });
    AC.state.signer = await AC.state.provider.getSigner();
    AC.state.account = await AC.state.signer.getAddress();
    AC.state.network = await AC.state.provider.getNetwork();

    localStorage.setItem(AC.LS.wallet, AC.state.account);
    AC.updateWalletUI();
    AC.toast("Connected: " + AC.shortAddr(AC.state.account));
    AC.showApp();
  }catch(err){
    console.error(err);
    AC.toast("Connection rejected or failed.");
  }
};

AC.mockConnect = () => {
  localStorage.setItem(AC.LS.mock, "1");
  AC.state.account = "0xDEMO00000000000000000000000000000000DEMO";
  AC.state.network = { chainId: 11155111n };
  AC.state.provider = null;
  AC.state.signer = null;

  localStorage.setItem(AC.LS.wallet, AC.state.account);
  AC.updateWalletUI();
  AC.toast("Mock connected. You can open all pages.");
  AC.showApp();
};

AC.disconnectWallet = () => {
  AC.state.provider = null;
  AC.state.signer = null;
  AC.state.account = null;
  AC.state.network = null;
  localStorage.removeItem(AC.LS.wallet);
  localStorage.removeItem(AC.LS.mock);
  AC.updateWalletUI();
  AC.showAuth();
  AC.toast("Disconnected (local).");
};

AC.restoreWalletIfPossible = async () => {
  const saved = localStorage.getItem(AC.LS.wallet);
  if(!saved) return;

  if(localStorage.getItem(AC.LS.mock) === "1"){
    AC.state.account = saved;
    AC.state.network = { chainId: 11155111n };
    AC.updateWalletUI();
    AC.showApp();
    return;
  }

  if(!window.ethereum) return;

  await AC.initProvider();
  try{
    const accs = await window.ethereum.request({ method: "eth_accounts" });
    if(accs && accs.length){
      AC.state.signer = await AC.state.provider.getSigner();
      AC.state.account = accs[0];
      AC.state.network = await AC.state.provider.getNetwork();
      localStorage.setItem(AC.LS.wallet, AC.state.account);
      AC.updateWalletUI();
      AC.showApp();
    }
  }catch(_){}
};
