window.AC = window.AC || {};

(function boot(){
  AC.updateWalletUI();
  AC.showAuth();
  AC.restoreWalletIfPossible();

  document.getElementById("connectBtnAuth").addEventListener("click", AC.connectWallet);
  document.getElementById("mockConnectBtn").addEventListener("click", AC.mockConnect);
  document.getElementById("disconnectBtn").addEventListener("click", AC.disconnectWallet);

  if (AC.Cert && typeof AC.Cert.wireCertificateUI === "function") {
    AC.Cert.wireCertificateUI();
  }


})();

