async function refresh() {
  const res = await fetch("/api/bitget");
  const data = await res.json();
  document.getElementById("symbol").innerText = data.symbol;
  document.getElementById("spot").innerText = data.spot;
  document.getElementById("future").innerText = data.future;
  document.getElementById("spread").innerText = data.spread;
}

async function manualTrade() {
  document.getElementById("status").innerText = "Running...";
  const res = await fetch("/api/trade");
  const data = await res.json();
  document.getElementById("status").innerText = data.status + " (Spread: " + data.spread + "%)";
}

setInterval(refresh, 5000);
refresh();
