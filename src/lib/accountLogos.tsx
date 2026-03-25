export const accountLogos: Record<string, React.ReactNode> = {
  paypal: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.477z" fill="#009cde"/>
      <path d="M6.635 7.565a.982.982 0 0 1 .97-.833h6.137c.728 0 1.405.048 2.021.149a8.55 8.55 0 0 1 .98.236 5.29 5.29 0 0 1 1.348.62c.385-2.455-.003-4.12-1.333-5.633C15.467.862 13.114.16 10.05.16H2.595c-.61 0-1.13.445-1.225 1.047L.01 17.62a.737.737 0 0 0 .728.852H5.4l1.235-7.847-.001-.038.001-.027v-.994z" fill="#003087"/>
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635bff"/>
    </svg>
  ),
  commbank_transaction: (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" className="h-6 w-6 shrink-0">
      <defs>
        <linearGradient id="cba-tx-lg1" x1="13.22" y1="-130.02" x2="50.78" y2="-161.53" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff0"/><stop offset="0.27" stopColor="#fef10c"/><stop offset="0.45" stopColor="#fde516"/>
          <stop offset="0.64" stopColor="#fde113"/><stop offset="0.82" stopColor="#fed508"/><stop offset="0.92" stopColor="#fc0"/>
        </linearGradient>
        <linearGradient id="cba-tx-lg2" x1="38.93" y1="-154.54" x2="50.6" y2="-161.84" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0.1" stopColor="#874400"/><stop offset="0.26" stopColor="#d88a00"/><stop offset="0.37" stopColor="#e79d00"/>
          <stop offset="0.52" stopColor="#f2b400"/><stop offset="0.7" stopColor="#fad202"/><stop offset="0.9" stopColor="#fedf03"/>
        </linearGradient>
      </defs>
      <polyline fill="url(#cba-tx-lg1)" points="32 0 64 32 32 64 0 32 32 0"/>
      <polygon fill="url(#cba-tx-lg2)" points="44.15 35.24 32 64 32 64 64 32 55.69 23.68 44.15 35.24"/>
    </svg>
  ),
  commbank_saver: (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" className="h-6 w-6 shrink-0">
      <defs>
        <linearGradient id="cba-sv-lg1" x1="13.22" y1="-130.02" x2="50.78" y2="-161.53" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff0"/><stop offset="0.27" stopColor="#fef10c"/><stop offset="0.45" stopColor="#fde516"/>
          <stop offset="0.64" stopColor="#fde113"/><stop offset="0.82" stopColor="#fed508"/><stop offset="0.92" stopColor="#fc0"/>
        </linearGradient>
        <linearGradient id="cba-sv-lg2" x1="38.93" y1="-154.54" x2="50.6" y2="-161.84" gradientTransform="matrix(1,0,0,-1,0,-113.78)" gradientUnits="userSpaceOnUse">
          <stop offset="0.1" stopColor="#874400"/><stop offset="0.26" stopColor="#d88a00"/><stop offset="0.37" stopColor="#e79d00"/>
          <stop offset="0.52" stopColor="#f2b400"/><stop offset="0.7" stopColor="#fad202"/><stop offset="0.9" stopColor="#fedf03"/>
        </linearGradient>
      </defs>
      <polyline fill="url(#cba-sv-lg1)" points="32 0 64 32 32 64 0 32 32 0"/>
      <polygon fill="url(#cba-sv-lg2)" points="44.15 35.24 32 64 32 64 64 32 55.69 23.68 44.15 35.24"/>
    </svg>
  ),
}
