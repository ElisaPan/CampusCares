// import React, { useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { loginTest } from '../../api';
// import { User } from '../../types';
// import './index.scss';
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// interface LoginProps {
//   onGoogleSignIn: () => void;
//   error: string | null;
//   isLoading: boolean;
//   setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
//   mode: string
// }

// const Login: React.FC<LoginProps> = ({ onGoogleSignIn, error, isLoading, setCurrentUser, mode }) => {
//   const navigate = useNavigate();
//   const env = import.meta.env.VITE_ENV;

//   useEffect(() => {
//     AOS.init({ duration: 500 });
//   }, [])

//   useEffect(() => {
//     AOS.refresh();
//   }, [mode]);

//   const handleLoginTest = async (id: number) => {
//     try {
//       const res = await loginTest(id);

//       const data: User = await res.json();
//       setCurrentUser(data);

//       navigate("/");
//     } catch (err) {
//     }
//   }

//   const ver = mode == 'login' ? 'in' : 'up';

//   return (
//     <div className="login" key={mode}>
//       <div className="login-container" data-aos="fade-down">
//         <img
//           src="/logo.png"
//           alt="CampusCares Logo"
//           className="login-logo"
//         />
//         <h1 className="login-title">CampusCares</h1>
//         <p className="login-subtitle">Your hub for making a difference in Ithaca.</p>

//         <div className="login-content">
//           <h2 className="login-welcome">{mode == 'login' ? 'Welcome Back!' : 'Welcome!'}</h2>

//           {error && (
//             <div className="login-error">
//               <p>{error}</p>
//             </div>
//           )}

//           <button
//             onClick={onGoogleSignIn}
//             disabled={isLoading}
//             className="login-button login-button--google"
//           >
//             {isLoading ? (
//               <>
//                 <div className="login-spinner"></div>
//                 Signing {ver}...
//               </>
//             ) : (
//               <>
//                 Sign {ver} with Cornell/IC email
//               </>
//             )}
//           </button>

//           {mode == 'login' ? (
//             <div className="subq">
//               <p>Don't have an account?</p>
//               <Link to="/sign-up" className="login-link">
//                 Sign up
//               </Link>
//             </div>
//           ) : (
//             <div className="subq">
//               <p>Already have an account?</p>
//               <Link to="/login" className="login-link">
//                 Log in
//               </Link>
//             </div>
//           )
//           }

//           {env == 'staging' &&
//             <div className="login-test-buttons">
//               {Array.from({ length: 8 }).map((_, i) =>
//                 <button
//                   key={i + 1}
//                   className="login-button login-button--test"
//                   onClick={() => handleLoginTest(i + 1)}
//                 >
//                   <p>Sign in with test user {i + 1}</p>
//                   <p style={{ color: 'darkblue' }}>{i % 2 == 1 ? '(admin)' : ''}</p>
//                 </button>
//               )}
//             </div>
//           }

//           <div className="bottom-info">
//             <p className="login-contact">
//               Not a student? Reach out to{' '}
//               <a href="mailto:team@campuscares.us">
//                 team@campuscares.us
//               </a>
//               .
//             </p>

//             <p className="login-terms">
//               By signing {ver}, you agree to our{' '}
//               <a
//                 href="/terms_of_service.pdf"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 Terms of Service and Privacy Policy
//               </a>
//               .
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

// @import '../../variables';

// $cornell-red: #b31b1b;
// $cornell-red-dark: #991515;
// $light-gray: #f3f4f6;
// $border-gray: #d1d5db;
// $text-gray: #6b7280;
// $text-dark: #1f2937;
// $error-bg: #fef2f2;
// $error-border: #fecaca;
// $error-text: #dc2626;

// .login {
//     width: 100vw;
//     height: 100vh;
//     display: flex;
//     align-items: center;
//     justify-content: center;
// }

// .login-container {
//     width: 100%;
//     max-width: 28rem;
//     height: fit-content;
//     background-color: white;
//     padding: 2rem;
//     border-radius: 1rem;
//     box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//     text-align: center;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
// }

// .login-logo {
//     margin: 0 auto 1rem;
//     height: 4rem;
//     width: 4rem;
//     object-fit: contain;
// }

// .login-title {
//     font-size: 1.875rem;
//     font-weight: 700;
//     color: $red;
//     margin-bottom: 0.5rem;
// }

// .login-subtitle {
//     color: $text-gray;
//     margin-bottom: 1.5rem;
// }

// .login-content {
//     display: flex;
//     flex-direction: column;
//     gap: 1rem;
// }

// .login-welcome {
//     font-size: 1.5rem;
//     font-weight: 600;
//     color: $text-dark;
//     margin-bottom: 0.5rem;
// }

// .login-error {
//     background-color: $error-bg;
//     border: 1px solid $error-border;
//     border-radius: 0.5rem;
//     padding: 1rem;
//     margin-bottom: 1rem;

//     p {
//         color: $error-text;
//         font-size: 0.875rem;
//         margin: 0;
//     }
// }

// .login-button {
//     width: 100%;
//     font-weight: 700;
//     padding: 0.75rem 1rem;
//     border-radius: 0.5rem;
//     transition: all 0.2s;
//     cursor: pointer;
//     border: none;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 0.75rem;

//     &:disabled {
//         opacity: 0.5;
//         cursor: not-allowed;
//     }

//     &--google {
//         background-color: white;
//         border: 2px solid $border-gray;
//         color: $cornell-red;
//         font-weight: 600;

//         &:hover:not(:disabled) {
//             background-color: $light-gray;
//         }
//     }

//     &--primary {
//         background-color: $cornell-red;
//         color: white;

//         &:hover:not(:disabled) {
//             background-color: $cornell-red-dark;
//         }
//     }

//     &--test {
//         background-color: $light-gray;
//         color: black;
//     }
// }

// .login-spinner {
//     animation: spin 1s linear infinite;
//     border-radius: 50%;
//     height: 1.25rem;
//     width: 1.25rem;
//     border: 2px solid transparent;
//     border-bottom-color: $cornell-red;
// }

// @keyframes spin {
//     from {
//         transform: rotate(0deg);
//     }

//     to {
//         transform: rotate(360deg);
//     }
// }

// .login-divider {
//     position: relative;
//     margin: 1.5rem 0;

//     &__line {
//         position: absolute;
//         inset: 0;
//         display: flex;
//         align-items: center;

//         &::before {
//             content: '';
//             width: 100%;
//             border-top: 1px solid $border-gray;
//         }
//     }

//     &__text {
//         position: relative;
//         display: flex;
//         justify-content: center;
//         font-size: 0.875rem;

//         span {
//             padding: 0 0.5rem;
//             background-color: white;
//             color: $text-gray;
//         }
//     }
// }

// .login-test-buttons {
//     display: flex;
//     flex-direction: column;
//     gap: 0.625rem;
// }

// .login-terms {
//     font-size: 0.75rem;
//     color: $text-gray;
//     margin-top: 1rem;

//     a {
//         text-decoration: underline;
//         color: inherit;

//         &:hover {
//             color: $text-dark;
//         }
//     }
// }

// .login-contact {
//     font-size: 0.875rem;
//     color: $text-gray;
//     margin-top: 2rem;

//     a {
//         color: $cornell-red;

//         &:hover {
//             text-decoration: underline;
//         }
//     }
// }

// .subq {
//     font-size: 14px;
//     display: flex;
//     flex-direction: row;
//     align-items: center;
//     justify-content: center;
//     gap: 5px;

//     .login-link {
//         font-weight: 600;

//         &:hover {
//             text-decoration: underline;
//         }
//     }
// }

// .bottom-info {
//     display: flex;
//     flex-direction: column;
//     gap: 0px
// }