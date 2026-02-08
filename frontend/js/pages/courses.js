window.AC = window.AC || {};

AC.openCourse = (id) => {
  localStorage.setItem(AC.LS.selectedCourse, id);
  location.hash = "#/course";
};

function errMsg(e) {
  if (e?.code === 4001) return "Transaction rejected in MetaMask.";
  return (
    e?.shortMessage ||
    e?.reason ||
    e?.info?.error?.message ||
    e?.message ||
    "Transaction failed."
  );
}

AC.buyCourse = async (courseId) => {
  const { account } = AC.state;
  if (!account) {
    AC.toast("Please connect a wallet first.");
    return;
  }

  const course = AC.COURSES.find(c => c.id === courseId);
  if (!course) {
    AC.toast("Course not found.");
    return;
  }

  const isMock = localStorage.getItem(AC.LS.mock) === "1";
  if (isMock) {
    const my = AC.getMyCourses();
    if (!AC.myCourseEntry(courseId)) {
      my.push({
        id: courseId,
        purchasedAt: new Date().toISOString(),
        progress: 0,
        status: "in_progress",
        txHash: "0xMOCKTX"
      });
      AC.setMyCourses(my);
    }
    AC.toast("Mock purchase success. Course added to My Courses.");
    location.hash = "#/my-courses";
    return;
  }

  const ok = await AC.initProvider();
  if (!ok) {
    AC.toast("MetaMask not found. Use Mock Connect.");
    return;
  }

  try {
    await AC.initContracts();

    const courseId32 = AC.courseIdToBytes32(courseId);
    const value = ethers.parseEther(course.priceEth); // bigint

    AC.logTx?.({ title: "Buy course (ETH)", status: "wait" });

    const tx = await AC.contracts.platform.buyCourse(courseId32, { value });

    AC.logTx?.({ title: "Tx sent (ETH buy)", status: "wait", hash: tx.hash });

    const receipt = await tx.wait();

    // receipt.status: 1 (success) / 0 (fail)
    if (receipt?.status === 0n || receipt?.status === 0) {
      AC.logTx?.({ title: "Buy failed (reverted)", status: "err", hash: tx.hash });
      AC.toast("Buy failed (reverted).");
      return;
    }

    AC.logTx?.({
      title: "Course purchased (ETH)",
      status: "ok",
      hash: tx.hash,
      blockNumber: receipt.blockNumber
    });

    // UI: записываем в myCourses только если tx успешна
    const my = AC.getMyCourses();
    if (!AC.myCourseEntry(courseId)) {
      my.push({
        id: courseId,
        purchasedAt: new Date().toISOString(),
        progress: 0,
        status: "in_progress",
        txHash: tx.hash
      });
      AC.setMyCourses(my);
    }

    AC.toast("Course purchased on-chain!");
    location.hash = "#/my-courses";
  } catch (e) {
    console.error(e);
    AC.logTx?.({ title: "Buy course (ETH)", status: "err" });
    AC.toast(errMsg(e));
  }
};

AC.buyCourseWithBonus = async (courseId) => {
  const { account } = AC.state;
  if (!account) return AC.toast("Please connect a wallet first.");

  const course = AC.COURSES.find(c => c.id === courseId);
  if (!course) return AC.toast("Course not found");

  const isMock = localStorage.getItem(AC.LS.mock) === "1";
  if (isMock) {
    const my = AC.getMyCourses();
    if (!AC.myCourseEntry(courseId)) {
      my.push({
        id: courseId,
        purchasedAt: new Date().toISOString(),
        progress: 0,
        status: "in_progress",
        txHash: "0xMOCKBNST"
      });
      AC.setMyCourses(my);
    }
    AC.toast("Mock BNST purchase success.");
    location.hash = "#/my-courses";
    return;
  }

  try {
    await AC.initContracts();
    const platform = AC.contracts.platform;
    const token = AC.contracts.bonusToken;

    const courseId32 = AC.courseIdToBytes32(courseId);

    const [price, bal] = await Promise.all([
      platform.bonusPrice(courseId32),
      token.balanceOf(account),
    ]);

    if (price === 0n) return AC.toast("Bonus price not set");

    if (bal < price) {
      AC.logTx?.({ title: "Buy course (BNST)", status: "err" });
      AC.toast("Not enough BNST tokens.");
      return;
    }

    const platformAddr = AC.CONTRACTS.platform;

    const current = await token.allowance(account, platformAddr);
    if (current < price) {
      AC.logTx?.({ title: "Approve BNST", status: "wait" });

      const tx1 = await token.approve(platformAddr, price);
      AC.logTx?.({ title: "Approve sent", status: "wait", hash: tx1.hash });

      const r1 = await tx1.wait();
      if (r1?.status === 0n || r1?.status === 0) {
        AC.logTx?.({ title: "Approve failed", status: "err", hash: tx1.hash });
        AC.toast("Approve failed (reverted).");
        return;
      }

      AC.logTx?.({ title: "Approve confirmed", status: "ok", hash: tx1.hash, blockNumber: r1.blockNumber });
    }

    AC.logTx?.({ title: "Buy course (BNST)", status: "wait" });

    const tx2 = await platform.buyCourseWithBonus(courseId32);

    AC.logTx?.({ title: "Buy sent (BNST)", status: "wait", hash: tx2.hash });

    const r2 = await tx2.wait();
    if (r2?.status === 0n || r2?.status === 0) {
      AC.logTx?.({ title: "Buy failed (reverted)", status: "err", hash: tx2.hash });
      AC.toast("Buy failed (reverted).");
      return;
    }

    AC.logTx?.({
      title: "Course purchased (BNST)",
      status: "ok",
      hash: tx2.hash,
      blockNumber: r2.blockNumber
    });

    const my = AC.getMyCourses();
    if (!AC.myCourseEntry(courseId)) {
      my.push({
        id: courseId,
        purchasedAt: new Date().toISOString(),
        progress: 0,
        status: "in_progress",
        txHash: tx2.hash
      });
    } else {
      const x = my.find(m => m.id === courseId);
      x.purchasedAt ||= new Date().toISOString();
      x.txHash ||= tx2.hash;
      x.progress ??= 0;
      x.status ||= "in_progress";
    }
    AC.setMyCourses(my);

    await AC.refreshBalances?.();
    AC.toast("Purchased with BNST!");
    location.hash = "#/my-courses";
  } catch (e) {
    console.error(e);
    AC.logTx?.({ title: "Buy course (BNST)", status: "err" });
    AC.toast(errMsg(e));
  }
};

AC.renderCourses = () => {
  AC.setPage("All Courses", "Browse courses. Open a course to purchase it and start learning.");

  const rows = AC.COURSES.map(c => {
    const purchased = AC.isPurchased(c.id);
    const my = AC.myCourseEntry(c.id);
    const status = purchased
      ? (my?.status === "completed" ? `<span class="tag ok">completed</span>` : `<span class="tag warn">in progress</span>`)
      : `<span class="tag bad">not purchased</span>`;

    return `
      <tr>
        <td><b>${c.title}</b><div class="small">${c.issuer}</div></td>
        <td>
          <span class="tag">${c.priceEth} ETH</span>
          <span class="tag">payTo: <span class="mono">${AC.shortAddr(c.payTo)}</span></span>
        </td>
        <td>${c.tags.map(t => `<span class="tag">${t}</span>`).join("")}</td>
        <td>${status}</td>
        <td>
          <div class="rowBtns">
            <button onclick="AC.openCourse('${c.id}')">Open</button>
            ${purchased ? "" : `
              <button onclick="AC.buyCourseWithBonus('${c.id}')">Buy (BNST)</button>
              <button class="btnPrimary" onclick="AC.buyCourse('${c.id}')">Buy (ETH)</button>
            `}
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
            <tr><th>Course</th><th>Payment</th><th>Tags</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="muted" style="margin-top:10px;font-size:12px">
          Tip: Replace <span class="mono">payTo</span> with your testnet receiver address. In Mock mode, purchase is simulated.
        </div>
      </div>
    </div>
  `;
};
