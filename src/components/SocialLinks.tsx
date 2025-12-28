import { ExternalLink } from './ExternalLink'

interface SocialLink {
  href: string
  label: string
}

const socialLinks: SocialLink[] = [
  { href: 'https://bsky.app/profile/itxryx.com', label: 'bsky.app' },
  { href: 'https://instagram.com/itxryx', label: 'instagram.com' },
  { href: 'https://github.com/itxryx', label: 'github.com' },
  { href: 'https://x.com/itxryx', label: 'x.com' },
]

export function SocialLinks() {
  return (
    <section className="mb-[1.6rem]">
      <h2>Social</h2>
      <ul>
        {socialLinks.map((link) => (
          <li key={link.href}>
            <ExternalLink href={link.href}>{link.label}</ExternalLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
