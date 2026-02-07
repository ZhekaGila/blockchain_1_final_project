window.AC = window.AC || {};

AC.addProgress = (courseId, delta=0.25) => {
  const my = AC.getMyCourses();
  const x = my.find(m => m.id === courseId);
  if(!x || !x.purchasedAt){
    AC.toast("Please buy the course first.");
    return;
  }
  x.progress = AC.clamp((x.progress ?? 0) + delta, 0, 1);
  x.status = (x.progress >= 1) ? "completed" : "in_progress";
  AC.setMyCourses(my);
  AC.toast("Progress: " + AC.percent(x.progress));
  AC.navigate();
};

AC.claimCertificate = (courseId) => {
  const course = AC.COURSES.find(c => c.id === courseId);
  const x = AC.myCourseEntry(courseId);
  if(!x || !x.purchasedAt){
    AC.toast("Please buy the course first.");
    return;
  }
  if((x.progress ?? 0) < 1){
    AC.toast("Certificate is available only after 100% progress.");
    return;
  }
  if(AC.hasCertificate(courseId)){
    AC.toast("Certificate already claimed.");
    return;
  }

  const certs = AC.getCerts();
  certs.unshift({
    id: "cert-" + Date.now(),
    courseId,
    title: `${course.title} — NFT Certificate`,
    owner: AC.state.account,
    issuedAt: new Date().toISOString().slice(0,10),
    txHashMock: "0x" + Math.random().toString(16).slice(2).padEnd(64,"0")
  });
  AC.setCerts(certs);

  AC.toast("Certificate claimed and added to My Certificates.");
  location.hash = "#/certificates";
};

AC.renderCourse = () => {
  const id = localStorage.getItem(AC.LS.selectedCourse) || AC.COURSES[0]?.id;
  const course = AC.COURSES.find(c => c.id === id) || AC.COURSES[0];

  const purchased = AC.isPurchased(course.id);
  const my = AC.myCourseEntry(course.id);
  const p = my?.progress ?? 0;
  const completed = p >= 1;
  const canClaim = purchased && completed && !AC.hasCertificate(course.id);

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
