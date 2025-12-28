interface BiographyProps {
  name: string
  title: string
}

export function Biography({ name, title }: BiographyProps) {
  return (
    <div className="my-[2.4rem] flex flex-col items-center justify-center">
      <p>{name}</p>
      <p>{title}</p>
    </div>
  )
}
