export interface AnatomyPart {
  brandNamePart: string;
  classPart: string;
  alcoholContentPart: string;
  netContentsPart: string;
  governmentWarningPart: string;
}

export const anatomyPrompt = ({
  brandNamePart,
  classPart,
  alcoholContentPart,
  netContentsPart,
  governmentWarningPart,
}: AnatomyPart) => `
# Instructions

Brand Name: ${brandNamePart}
Class: ${classPart}
Alcohol Content: ${alcoholContentPart}
Net Contents: ${netContentsPart}
Government Warning: ${governmentWarningPart}

1. Output your reasoning on a new line and prefix your reasoning with the label "Brand Name Reasoning:". 
2. If the complete case insensitive Brand Name is an **exact** match to the complete Brand Name in the image then classify the Brand Name as "Match" else classify the Brand Name as "Not Match".  
3. Output your classification on a new line and prefix your classification with "Brand Name Classification:"

4. Output your reasoning on a new line and prefix your reasoning with the label "Class Reasoning:". 
5. If the complete case insensitive Class is an **exact** match to the complete Class in the image then classify the Class as "Match" else classify the Class as "Not Match".
6. Output your classification on a new line and prefix your classification with "Class Classification:"

7. Output your reasoning on a new line and prefix your reasoning with the label "Alcohol Content Reasoning:". 
8. If the complete case insensitive Alcohol Content is an **exact** match to the complete Alcohol Content in the image then classify the Alcohol Content as "Match" else classify the Alcohol Content as "Not Match".
9. Output your classification on a new line and prefix your classification with "Alcohol Content Classification:"

10. Output your reasoning on a new line and prefix your reasoning with the label "Net Contents Reasoning:". 
11. If the complete case insensitive Net Contents is an **exact** match to the complete Net Contents in the image then classify the Net Contents as "Match" else classify the Net Contents as "Not Match".
12. Output your classification on a new line and prefix your classification with "Net Contents Classification:"

13. Output your reasoning on a new line and prefix your reasoning with the label "Government Warning Reasoning:".  In your reasoning step output the full text from the image and then compare it to the provided Government Warning. 
14. If the complete **case sensitive** Government Warning is an **exact** match to the complete Government Warning in the image, including punctuation and excluding formatting, then classify the Government Warning as "Match" else classify the Government Warning as "Not Match".
15. Output your classification on a new line and prefix your classification with "Government Warning Classification:"
`;
