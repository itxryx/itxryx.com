import type { MetaFunction } from "@remix-run/node";
import profile from "/images/profile.png";

export const meta: MetaFunction = () => {
  return [
    { title: "itxryx.com" },
    { name: "description", content: "itxryx.com" },
  ];
};

export default function Index() {
  return (
      <div className={"wrapper"}>
          <div className={"container-header"}>
              <header>
                  <h1>itxryx.com</h1>
              </header>
          </div>
          <main>
              <div className={"container-profile"}>
                  <img
                      src={profile}
                      className={"profile"}
                      alt={"itxryx profile"}/>
              </div>
              <div className={"container-biography"}>
                  <p>ito ryo / itxryx</p>
                  <p>Web Engineer</p>
              </div>
              <div className={"container-social"}>
                  <h2>Social</h2>
                  <ul>
                      <li>
                          <a
                              href="https://bsky.app/profile/itxryx.com"
                              target="_blank"
                              rel="noopener noreferrer"
                          >
                              bsky.app
                          </a>
                      </li>
                      <li>
                          <a
                              href="https://instagram.com/itxryx"
                              target="_blank"
                              rel="noopener noreferrer"
                          >
                              instagram.com
                          </a>
                      </li>
                      <li>
                          <a
                              href="https://github.com/itxryx"
                              target="_blank"
                              rel="noopener noreferrer"
                          >
                              github.com
                          </a>
                      </li>
                      <li>
                          <a
                              href="https://x.com/itxryx"
                              target="_blank"
                              rel="noopener noreferrer"
                          >
                              x.com
                          </a>
                      </li>
                  </ul>
              </div>
              <div className={"container-contact"}>
                  <h2>Contact</h2>
                  ...🤔
              </div>
          </main>
          <div className={"container-footer"}>
              <footer>
                  <p className={"footer-notice"}>
                      このWebサイトではGoogle Analyticsを使用しています。
                      <br/>
                      閲覧者のデータ収集のためにCookieを使用していますが、個人を特定するものではありません。
                  </p>
                  <br />
                  <p className={"footer-copyright"}>
                      &copy; 2025 ito ryo
                  </p>
              </footer>
          </div>
      </div>
  );
}
