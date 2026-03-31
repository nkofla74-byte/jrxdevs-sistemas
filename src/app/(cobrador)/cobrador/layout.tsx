import TutorialModal from '@/components/shared/TutorialModal'

export default function CobradorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <div style={{
        position: 'fixed', 
        bottom: 100, 
        right: 16,
        zIndex: 100,
      }}>
        <TutorialModal role="cobrador" />
      </div>
      {children}
    </div>
  )
}
