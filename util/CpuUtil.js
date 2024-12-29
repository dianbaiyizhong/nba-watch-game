const os = require("os");

module.exports.getCpuInfo = function() {
  const cpus = os.cpus();
  let totalCpuLoad = 0;
  cpus.forEach((cpu, index) => {
    // 计算每个 CPU 核心的负载（简化版）
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const cpuLoad = 100 - (cpu.times.idle / total * 100);
    totalCpuLoad += cpuLoad;
  });

  const averageCpuLoad = totalCpuLoad / cpus.length;

  return averageCpuLoad;

};
