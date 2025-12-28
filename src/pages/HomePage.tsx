import { ProfileImage } from '../components/ProfileImage'
import { Biography } from '../components/Biography'
import { SocialLinks } from '../components/SocialLinks'
import { Contact } from '../components/Contact'

export function HomePage() {
  return (
    <>
      <ProfileImage src="/images/profile.png" alt="itxryx profile" />
      <Biography name="komatsu ryo / itxryx" title="Web Engineer" />
      <SocialLinks />
      <Contact />
    </>
  )
}
