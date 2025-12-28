export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="my-[4rem] border-t border-foreground pt-[4rem]">
      <p className="text-[1rem]">
        このWebサイトではGoogle Analyticsを使用しています。
        <br />
        閲覧者のデータ収集のためにCookieを使用していますが、個人を特定するものではありません。
      </p>
      <p className="mt-[1rem] text-center text-[1rem]">&copy; {currentYear} komatsu ryo</p>
    </footer>
  )
}
