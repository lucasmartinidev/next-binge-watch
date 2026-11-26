export function CyberBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ds-void">
      <div className="ds-aurora-orb-a absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full blur-3xl" />
      <div className="ds-aurora-orb-b absolute -bottom-40 -right-24 h-[36rem] w-[36rem] rounded-full blur-3xl" />
      <div className="ds-cyber-grid absolute inset-0 opacity-75" />
      <div className="ds-cyber-scanlines absolute inset-0" />
    </div>
  );
}
