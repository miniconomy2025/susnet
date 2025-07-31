import AuthComponent from "../Components/AuthComponent/AuthComponent"

function Signup() {
  const handleGoogleLogin = () => {
    window.location.href = "/auth/google"
  }

  return (
    <AuthComponent
      onGoogleLogin={handleGoogleLogin}
      isSignup={false}
    />
  )
}

export default Signup