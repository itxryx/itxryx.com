interface ProfileImageProps {
  src: string
  alt: string
}

export function ProfileImage({ src, alt }: ProfileImageProps) {
  return (
    <div className="flex items-center justify-center">
      <img src={src} alt={alt} className="max-w-[296px] rounded-full" />
    </div>
  )
}
