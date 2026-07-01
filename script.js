const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function showScreen(id){
  $$(".screen").forEach(s => s.classList.remove("active"));
  $("#"+id).classList.add("active");
}

/* ================= AMBIENT ================= */
function startAmbientLayer(){
  const layer = $("#ambient-layer");
  const symbols=["💜","✨","🎳"];

  setInterval(()=>{
    const el=document.createElement("div");
    el.textContent=symbols[Math.random()*symbols.length|0];
    el.style.position="absolute";
    el.style.left=Math.random()*100+"vw";
    el.style.top="100vh";
    el.style.fontSize="20px";
    layer.appendChild(el);
    setTimeout(()=>el.remove(),8000);
  },1200);
}

/* ================= SCREEN 1 ================= */
function initInviteScreen(){
  const no=$("#no-btn");
  const yes=$("#yes-btn");
  const taunt=$("#taunt-text");

  const msgs=["🥺","really?","ouch","try again"];

  let count=0;

  function move(){
    no.classList.add("dodging");
    no.style.left=Math.random()*80+"vw";
    no.style.top=Math.random()*80+"vh";
    taunt.textContent=msgs[count++%msgs.length];
  }

  no.addEventListener("mouseenter",move);
  no.addEventListener("click",e=>{e.preventDefault();move()});
  no.addEventListener("touchstart",e=>{e.preventDefault();move()});

  yes.onclick=()=>{
    burstConfetti();
    setTimeout(()=>showScreen("confirm-screen"),400);
  };
}

/* ================= CALENDAR ================= */
const state={
  y:null,m:null,date:null,time:null
};

function initCalendar(){
  const today=new Date();
  state.y=today.getFullYear();
  state.m=today.getMonth();

  $("#cal-prev").onclick=()=>{state.m--;render()};
  $("#cal-next").onclick=()=>{state.m++;render()};

  render();
}

function render(){
  const grid=$("#cal-grid");
  grid.innerHTML="";

  const d=new Date(state.y,state.m,1);
  const start=d.getDay();
  const days=new Date(state.y,state.m+1,0).getDate();

  for(let i=0;i<start;i++){
    grid.innerHTML+="<div></div>";
  }

  for(let i=1;i<=days;i++){
    const b=document.createElement("button");
    b.className="cal-day";
    b.textContent=i;

    b.onclick=()=>{
      state.date=new Date(state.y,state.m,i);
      render();
      update();
    };

    if(state.date?.getDate()===i) b.classList.add("selected");

    grid.appendChild(b);
  }

  $("#cal-month-label").textContent=
    state.date?.toLocaleString('default',{month:'long'})||"Select";
}

/* ================= TIME ================= */
function initTime(){
  $$(".pill").forEach(p=>{
    p.onclick=()=>{
      $$(".pill").forEach(x=>x.classList.remove("selected"));
      p.classList.add("selected");

      if(p.dataset.time==="other"){
        $("#custom-time").classList.remove("hidden");
        state.time=null;
      }else{
        $("#custom-time").classList.add("hidden");
        state.time=p.dataset.time;
      }
      update();
    };
  });

  $("#custom-time").oninput=e=>{
    state.time=e.target.value;
    update();
  };
}

/* ================= UPDATE ================= */
function update(){
  const btn=$("#submit-btn");

  if(state.date && state.time){
    btn.disabled=false;
    $("#selection-summary").textContent="Ready 💜";
  }else{
    btn.disabled=true;
  }
}

/* ================= SUBMIT ================= */
function initSubmit(){
  $("#submit-btn").onclick=()=>{
    const text=`${state.date.toDateString()} at ${state.time}`;
    $("#thankyou-details").textContent=text;

    burstConfetti();
    setTimeout(()=>showScreen("thankyou-screen"),300);
  };
}

/* ================= CONFETTI ================= */
function burstConfetti(){
  const c=$("#confetti-canvas");
  const ctx=c.getContext("2d");
  c.width=innerWidth;
  c.height=innerHeight;

  const arr=Array.from({length:50},()=>({
    x:Math.random()*c.width,
    y:0,
    v:2+Math.random()*3,
    g:["💜","✨","🎳"][Math.random()*3|0]
  }));

  function anim(){
    ctx.clearRect(0,0,c.width,c.height);

    arr.forEach(p=>{
      p.y+=p.v;
      ctx.fillText(p.g,p.x,p.y);
    });

    requestAnimationFrame(anim);
  }
  anim();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded",()=>{
  startAmbientLayer();
  initInviteScreen();
  initCalendar();
  initTime();
  initSubmit();
});