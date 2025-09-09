<template>
  <section class="card">
    <h2>常用工具</h2>
    <div class="grid">
      <a class="tool" href="#">VPN</a>
      <a class="tool" href="#">Email</a>
      <a class="tool" href="#">內部搜尋</a>
      <a class="tool" href="#">會議室預約</a>
      <a class="tool" href="#">知識庫</a>
    </div>
  </section>
</template>
<style scoped>
.card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:10px}
.tool{display:block;border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-decoration:none;color:#1d2330;text-align:center;background:#fafafa}
.tool:hover{background:#f3f4f6}
</style>