import AuthComponent from "../components/AuthComponent/AuthComponent"

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = "/auth/google"
  }

  return (
    <AuthComponent
      onGoogleLogin={handleGoogleLogin}
      isSignup={true}
    />
  )
}

export default Login