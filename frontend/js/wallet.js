window.AC = window.AC || {};
AC.EXPECTED_CHAIN_ID = 31337n; // Hardhat localhost

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
  if (!ok) {
    AC.toast("MetaMask not found. Use Mock Connect to demo the UI.");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    AC.state.signer = await AC.state.provider.getSigner();
    AC.state.account = await AC.state.signer.getAddress();
    AC.state.network = await AC.state.provider.getNetwork();

    const genesis = await AC.state.provider.getBlock(0);
    const genesisHash = genesis?.hash || "nohash";
    const lastGenesis = localStorage.getItem("AC_LAST_GENESIS");

    if (lastGenesis && lastGenesis !== genesisHash) {
      AC.resetLocalDemoData?.(); 
      AC.toast("Hardhat restarted — local data reset.");
    }
    localStorage.setItem("AC_LAST_GENESIS", genesisHash);

    if (AC.state.network.chainId !== AC.EXPECTED_CHAIN_ID) {
      AC.toast("Wrong network. Switch MetaMask to Localhost 31337.");
      return;
    }

    await AC.initContracts();
    await AC.refreshBalances();
    await AC.syncMyCoursesFromChain?.();

    localStorage.setItem(AC.LS.wallet, AC.state.account);
    AC.updateWalletUI();
    AC.toast("Connected: " + AC.shortAddr(AC.state.account));
    AC.showApp();
  } catch (err) {
    console.error(err);
    AC.toast("Connection rejected or failed.");
  }
};


AC.mockConnect = () => {
  localStorage.setItem(AC.LS.mock, "1");

  AC.state.account = "0xDEMO00000000000000000000000000000000DEMO";
  AC.state.network = { chainId: 31337n };
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
  if (!saved) return;

  if (localStorage.getItem(AC.LS.mock) === "1") {
    AC.state.account = saved;
    AC.state.network = { chainId: 31337n }; // ✅ fixed
    AC.state.provider = null;
    AC.state.signer = null;

    AC.updateWalletUI();
    AC.showApp();
    return;
  }

  if (!window.ethereum) return;

  await AC.initProvider();

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts || !accounts.length) return;

    AC.state.signer = await AC.state.provider.getSigner();
    AC.state.account = accounts[0];
    AC.state.network = await AC.state.provider.getNetwork();

    const genesis = await AC.state.provider.getBlock(0);
    const genesisHash = genesis?.hash || "nohash";
    const lastGenesis = localStorage.getItem("AC_LAST_GENESIS");

    if (lastGenesis && lastGenesis !== genesisHash) {
      AC.resetLocalDemoData?.();
    }
    localStorage.setItem("AC_LAST_GENESIS", genesisHash);

    if (AC.state.network.chainId !== AC.EXPECTED_CHAIN_ID) {
      return;
    }

    await AC.initContracts();
    await AC.refreshBalances();
    await AC.syncMyCoursesFromChain?.();

    localStorage.setItem(AC.LS.wallet, AC.state.account);
    AC.updateWalletUI();
    AC.showApp();
  } catch (e) {
    console.error(e);
  }
};


