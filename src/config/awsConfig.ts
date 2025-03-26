export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "eu-west-3_ZtGH37iGb",
      userPoolClientId: "1ug6cl6l0ejr8mcpsl0jds2mt2",
      identityPoolId: "eu-west-3:474062d3-60a0-4d56-a367-ddd6e86a6bf3",
      region: "eu-west-3",
      signUpVerificationMethod: "code" as "code",
      loginWith: {
        email: true,
      },
    },
  },
};
