window.AC = window.AC || {};

AC.openCourse = (id) => {
  localStorage.setItem(AC.LS.selectedCourse, id);
  location.hash = "#/course";
};

AC.buyCourse = async (courseId) => {
  const { account } = AC.state;
  if(!account){
    AC.toast("Please connect a wallet first.");
    return;
  }
  const course = AC.COURSES.find(c => c.id === courseId);
  if(!course){
    AC.toast("Course not found.");
    return;
  }

  const isMock = localStorage.getItem(AC.LS.mock) === "1";
  if(isMock){
    const my = AC.getMyCourses();
    if(!AC.myCourseEntry(courseId)){
      my.push({ id: courseId, purchasedAt: new Date().toISOString(), progress: 0, status: "in_progress", txHash: "0xMOCKTX" });
      AC.setMyCourses(my);
    }
    AC.toast("Mock purchase success. Course added to My Courses.");
    location.hash = "#/my-courses";
    return;
  }

  const ok = await AC.initProvider();
  if(!ok){
    AC.toast("MetaMask not found. Use Mock Connect.");
    return;
  }
  try{
    AC.state.signer = await AC.state.provider.getSigner();
    AC.state.network = await AC.state.provider.getNetwork();
    AC.updateWalletUI();

    const cid = Number(AC.state.network.chainId);
    if(!AC.isTestnet(cid)){
      AC.toast("Warning: you are not on a test network.");
    }

    const value = ethers.parseEther(course.priceEth);
    const tx = await AC.state.signer.sendTransaction({ to: course.payTo, value });
    AC.toast("Transaction sent: " + tx.hash.slice(0,10) + "…");
    await tx.wait();

    const my = AC.getMyCourses();
    if(!AC.myCourseEntry(courseId)){
      my.push({ id: courseId, purchasedAt: new Date().toISOString(), progress: 0, status: "in_progress", txHash: tx.hash });
    }else{
      const x = my.find(m => m.id === courseId);
      x.purchasedAt ||= new Date().toISOString();
      x.txHash ||= tx.hash;
      x.progress ??= 0;
      x.status ||= "in_progress";
    }
    AC.setMyCourses(my);

    AC.toast("Purchase successful! Course added to My Courses.");
    location.hash = "#/my-courses";
  }catch(err){
    console.error(err);
    AC.toast("Transaction rejected or failed.");
  }
};

AC.renderCourses = () => {
  AC.setPage("All Courses", "Browse courses. Open a course to purchase it and start learning.");

  const rows = AC.COURSES.map(c=>{
    const purchased = AC.isPurchased(c.id);
    const my = AC.myCourseEntry(c.id);
    const status = purchased
      ? (my?.status === "completed" ? `<span class="tag ok">✅ completed</span>` : `<span class="tag warn">⏳ in progress</span>`)
      : `<span class="tag bad">not purchased</span>`;

    return `
      <tr>
        <td><b>${c.title}</b><div class="small">${c.issuer}</div></td>
        <td>
          <span class="tag">${c.priceEth} ETH</span>
          <span class="tag">payTo: <span class="mono">${AC.shortAddr(c.payTo)}</span></span>
        </td>
        <td>${c.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</td>
        <td>${status}</td>
        <td>
          <div class="rowBtns">
            <button onclick="AC.openCourse('${c.id}')">Open</button>
            ${purchased ? "" : `<button class="btnPrimary" onclick="AC.buyCourse('${c.id}')">Buy (transfer)</button>`}
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
