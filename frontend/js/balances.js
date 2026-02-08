window.AC = window.AC || {};

AC.refreshBalances = async () => {
  try {
    if (!AC.state?.account) return;
    if (!AC.contracts?.bonusToken) return;

    // token
    const [raw, decimals, symbol] = await Promise.all([
      AC.contracts.bonusToken.balanceOf(AC.state.account),
      AC.contracts.bonusToken.decimals(),
      AC.contracts.bonusToken.symbol()
    ]);

    const formatted = ethers.formatUnits(raw, decimals);

    AC.state.balances = AC.state.balances || {};
    AC.state.balances.bonus = {
      raw: raw.toString(),
      formatted,   
      symbol       
    };
  } catch (e) {
    console.error("refreshBalances failed:", e);
  }
};
