window.AC = window.AC || {};

AC.addProgress = async (courseId, delta = 0.25) => {
  const my = AC.getMyCourses();
  const x = my.find(m => m.id === courseId);

  if (!x || !x.purchasedAt) {
    AC.toast("Please buy the course first.");
    return;
  }

  x.progress = AC.clamp((x.progress ?? 0) + delta, 0, 1);
  x.status = (x.progress >= 1) ? "completed" : "in_progress";
  AC.setMyCourses(my);

  if (x.progress >= 1 && !x.onchainCompleted) {
    const isMock = localStorage.getItem(AC.LS.mock) === "1";
    if (!isMock) {
      try {
        await AC.initContracts();
        const platform = AC.contracts.platform;
        const courseId32 = AC.courseIdToBytes32(courseId);

        AC.logTx?.({ title: "Complete course (on-chain)", status: "wait" });

        AC.logTx?.({ title: "TX: platform.completeCourse(bytes32)", status: "wait" });

        const tx = await platform.completeCourse(courseId32);
        AC.logTx?.({ title: "Complete sent", status: "wait", hash: tx.hash });
        AC.toast("Completing on-chain… " + tx.hash.slice(0, 10) + "…");

        const receipt = await tx.wait();

        if (receipt?.status === 0n || receipt?.status === 0) {
          AC.logTx?.({ title: "Complete reverted", status: "err", hash: tx.hash });
          AC.toast("Complete reverted (tx failed).");
        } else {
          const done = await platform.completed(AC.state.account, courseId32);
          if (!done) {
            AC.logTx?.({ title: "Complete not recorded", status: "err", hash: tx.hash });
            AC.toast("Complete confirmed, but state not updated (wrong network/contract?).");
          } else {
            x.onchainCompleted = true;
            AC.setMyCourses(my);

            await AC.refreshBalances?.();
            AC.logTx?.({ title: "Course completed (on-chain)", status: "ok", hash: tx.hash, blockNumber: receipt.blockNumber });
            AC.toast("Completed on-chain + bonus minted!");
          }
        }
      } catch (e) {
        console.error(e);
        const msg =
          (e?.code === 4001) ? "Complete rejected in MetaMask." :
          (e?.shortMessage || e?.reason || e?.info?.error?.message || e?.message || "CompleteCourse failed.");
        AC.logTx?.({ title: "Complete course (on-chain)", status: "err" });
        AC.toast(msg);
      }
    } else {
      x.onchainCompleted = true;
      AC.setMyCourses(my);
    }
  }

  AC.toast("Progress: " + AC.percent(x.progress));
  AC.navigate();
};

AC.addNftToMetaMask = async (tokenId) => {
  if (!window.ethereum) {
    AC.toast("MetaMask not found");
    return false;
  }

  try {
    const added = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC721",
        options: {
          address: AC.CONTRACTS.certificateNFT,
          tokenId: String(tokenId),
        },
      },
    });

    if (added) AC.toast("NFT added to MetaMask!");
    else AC.toast("NFT not added.");
    return !!added;
  } catch (e) {
    console.error(e);
    AC.toast("Failed to add NFT to MetaMask");
    return false;
  }
};


AC.completeCourseOnChain = async (courseId) => {
  const isMock = localStorage.getItem(AC.LS.mock) === "1";
  if (isMock) {
    const my = AC.getMyCourses();
    const x = my.find(m => m.id === courseId);
    if (x) {
      x.onchainCompleted = true;
      x.status = "completed";
      x.progress = 1;
      AC.setMyCourses(my);
    }
    AC.navigate?.();
    return true;
  }

  try {
    await AC.initContracts();
    const platform = AC.contracts.platform;
    const cid = AC.courseIdToBytes32(courseId);

    const already = await platform.completed(AC.state.account, cid);
    if (already) {
      const my = AC.getMyCourses();
      const x = my.find(m => m.id === courseId);
      if (x) {
        x.onchainCompleted = true;
        x.status = "completed";
        x.progress = 1;
        AC.setMyCourses(my);
      }
      AC.navigate?.();
      return true;
    }

    AC.logTx?.({ title: "TX: platform.completeCourse(bytes32)", status: "wait" });

    const tx = await platform.completeCourse(cid);
    AC.logTx?.({ title: "Complete sent", status: "wait", hash: tx.hash });

    const r = await tx.wait();
    if (r?.status === 0n || r?.status === 0) {
      AC.logTx?.({ title: "Complete reverted", status: "err", hash: tx.hash });
      AC.toast("Complete reverted (tx failed).");
      return false;
    }

    const done = await platform.completed(AC.state.account, cid);
    if (!done) {
      AC.toast("Complete confirmed, but state is still false (wrong network/contract?).");
      return false;
    }

    const my = AC.getMyCourses();
    const x = my.find(m => m.id === courseId);
    if (x) {
      x.onchainCompleted = true;
      x.status = "completed";
      x.progress = 1;
      AC.setMyCourses(my);
    }

    AC.logTx?.({ title: "Course completed (on-chain)", status: "ok", hash: tx.hash, blockNumber: r.blockNumber });
    AC.toast("Completed on-chain!");
    AC.navigate?.();
    return true;

  } catch (e) {
    console.error(e);
    const msg =
      (e?.code === 4001) ? "Complete rejected in MetaMask." :
      (e?.shortMessage || e?.reason || e?.info?.error?.message || e?.message || "CompleteCourse failed.");
    AC.toast(msg);
    return false;
  }
};


AC.claimCertificate = async (courseId) => {
  const course = AC.COURSES.find(c => c.id === courseId);
  const x = AC.myCourseEntry(courseId);

  const rpcErrMsg = (e) => (
    e?.shortMessage ||
    e?.reason ||
    e?.data?.message ||
    e?.info?.error?.data?.message ||
    e?.info?.error?.message ||
    e?.message ||
    "Transaction failed."
  );

  if (!x || !x.purchasedAt) return AC.toast("Please buy the course first.");
  if ((x.progress ?? 0) < 1) return AC.toast("Certificate is available only after 100% progress.");
  if (!x.onchainCompleted) return AC.toast("On-chain: course not completed yet. Click Complete on-chain first.");

  if (AC._minting) return;
  AC._minting = true;

  try {
    await AC.initContracts();
    const platform = AC.contracts.platform;
    const cid = AC.courseIdToBytes32(courseId);

    const isCompleted = await platform.completed(AC.state.account, cid);
    if (!isCompleted) {
      AC.toast("On-chain: course not completed yet. Click Complete on-chain first.");
      return;
    }

    try {
      const evs = await platform.queryFilter(
        platform.filters.CertificateMinted(AC.state.account, cid),
        0,
        "latest"
      );

      if (evs && evs.length > 0) {
        const ev = evs[evs.length - 1];
        const tokenId = ev.args.tokenId.toString();

        const certs = AC.getCerts();
        certs.unshift({
          id: "cert-" + ev.transactionHash + "-" + tokenId,
          courseId,
          title: `${(course?.title ?? courseId)} — NFT Certificate`,
          owner: AC.state.account,
          issuedAt: new Date().toISOString().slice(0, 10),
          txHash: ev.transactionHash,
          tokenId
        });
        AC.setCerts(certs);

        AC.toast("Already minted on-chain. Restored in My Certificates.");
        location.hash = "#/certificates";
        return;
      }
    } catch (e) {
      console.warn("Mint pre-check failed (still trying mint):", e);
    }

    AC.logTx?.({ title: "TX: platform.mintCertificate(bytes32)", status: "wait" });

    const tx = await platform.mintCertificate(cid);
    AC.toast("Minting certificate… " + tx.hash.slice(0, 10) + "…");

    const receipt = await tx.wait();

    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = platform.interface.parseLog(log);
        if (parsed && parsed.name === "CertificateMinted") {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (_) {}
    }

    const certs = AC.getCerts();
    certs.unshift({
      id: "cert-" + Date.now(),
      courseId,
      title: `${(course?.title ?? courseId)} — NFT Certificate`,
      owner: AC.state.account,
      issuedAt: new Date().toISOString().slice(0, 10),
      txHash: tx.hash,
      tokenId
    });
    AC.setCerts(certs);

    AC.toast("Certificate minted!");

    if (tokenId) {
      await AC.addNftToMetaMask(tokenId);
    }

    if (AC.Cert && typeof AC.Cert.viewCertificate === "function") {
      AC.Cert.viewCertificate({
        ...certs[0],
        courseTitle: course?.title ?? courseId,
        issuer: course?.issuer ?? "Course Platform"
      });
    } else {
      location.hash = "#/certificates";
    }

  } catch (e) {
    console.error(e);

    if (e?.code === 4001) {
      AC.toast("Transaction rejected in MetaMask.");
      return;
    }

    const msg = rpcErrMsg(e);
    if (String(msg).includes("Already minted")) {
      AC.toast("Already minted on-chain. Open My Certificates.");
      location.hash = "#/certificates";
      return;
    }

    AC.toast(msg);
  } finally {
    AC._minting = false;
  }
};



AC.renderCourse = () => {
  const id = localStorage.getItem(AC.LS.selectedCourse) || AC.COURSES[0]?.id;
  const course = AC.COURSES.find(c => c.id === id) || AC.COURSES[0];

  const purchased = AC.isPurchased(course.id);
  const my = AC.myCourseEntry(course.id);
  const p = my?.progress ?? 0;
  const completed = p >= 1;
  const canClaim = purchased && completed && my?.onchainCompleted && !AC.hasCertificate(course.id);


  AC.setPage("Course Page", "Video lessons (cats 🐱), progress, purchase, and certificate.");

  document.getElementById("page").innerHTML = `
    <div class="grid">
      <div class="card block col7">
        <div class="h2">${course.title}</div>
        <div class="muted">${course.summary}</div>

        <div style="margin-top:10px">
          <span class="tag">${course.issuer}</span>
          <span class="tag">${course.priceEth} ETH</span>
          <span class="tag">payTo: <span class="mono">${AC.shortAddr(course.payTo)}</span></span>
          ${course.tags.map(t=>`<span class="tag">${t}</span>`).join("")}
        </div>

        <div style="margin-top:12px" class="h2">Purchase & Progress</div>
        <div class="muted">
          ${purchased ? `<span class="tag ok">purchased</span>` : `<span class="tag bad">not purchased</span>`}
          ${completed ? `<span class="tag ok">completed</span>` : (purchased ? `<span class="tag warn">in progress</span>` : "")}
        </div>

        <div style="margin-top:10px">
          <div class="bar"><div style="width:${Math.round(p*100)}%"></div></div>
          <div class="small" style="margin-top:6px">Progress: ${AC.percent(p)}</div>
        </div>

        <div class="rowBtns">
          ${purchased ? "" : `<button class="btnPrimary" onclick="AC.buyCourse('${course.id}')">Buy course (transfer)</button>`}
          ${purchased ? `<button class="btnOk" onclick="AC.addProgress('${course.id}', 0.25)">Mark lesson done (+25%)</button>` : ""}
          ${canClaim ? `<button class="btnPrimary" onclick="AC.claimCertificate('${course.id}')">Claim certificate</button>` : ""}
          <button onclick="location.hash='#/courses'">Back to catalog</button>
        </div>

        <div class="muted" style="margin-top:10px;font-size:12px">
          Note: Videos are embedded. If YouTube is blocked, replace the iframe links with your own hosted videos.
        </div>
      </div>

      <div class="card block col5">
        <div class="h2">Cat Lessons </div>

        <div class="videoGrid">
          <div class="videoCard">
            <iframe src="https://www.youtube-nocookie.com/embed/J---aiyznGQ" title="Cat Lesson 1"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="videoMeta">
              <p class="videoTitle">Lesson 1 — Attention & Focus (with cats)</p>
              <p class="videoDesc">Warm-up: focus your attention while the cat does… cat things.</p>
            </div>
          </div>

          <div class="videoCard">
            <iframe src="https://www.youtube-nocookie.com/embed/tntOCGkgt98" title="Cat Lesson 2"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="videoMeta">
              <p class="videoTitle">Lesson 2 — “Proof of Work” explained by a cat (kind of)</p>
              <p class="videoDesc">You watch a cat; we pretend it’s blockchain education. Everybody wins.</p>
            </div>
          </div>

          <div class="videoCard">
            <iframe src="https://www.youtube-nocookie.com/embed/hY7m5jjJ9mM" title="Cat Lesson 3"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="videoMeta">
              <p class="videoTitle">Lesson 3 — Final Review (cats + calm)</p>
              <p class="videoDesc">After finishing all lessons and reaching 100%, claim your certificate.</p>
            </div>
          </div>
        </div>

        <div class="muted" style="margin-top:10px;font-size:12px">
          Tip: Use the “Mark lesson done (+25%)” button after each video to simulate learning progress.
        </div>
      </div>
    </div>
  `;
};
