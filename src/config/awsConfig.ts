export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "eu-west-3_ZlSturcjQ",
      userPoolClientId: "56omurop82nikgflro32a4fppr", // Your new SPA client ID
      identityPoolId: "eu-west-3:4b0c2f8e-5b9f-4a2d-a1a5-7f0e0c4b1d3a",
      region: "eu-west-3",
      signUpVerificationMethod: "code",
      loginWith: {
        email: true,
      },
    },
  },
};
