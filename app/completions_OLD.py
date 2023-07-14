import asyncio
import requests
import os
import openai
import re
from .validatename import validate_company_name_gpt

def get_api_key():
    api_key = os.environ["OPENAI_API_KEY"]
    openai.api_key = api_key    
    return api_key

api_key = get_api_key()

def generate_gpt4_response(prompt, modality, api_key):
    try:
        print("Prompt: ", prompt)   # print prompt
        print("Modality: ", modality)   # print modality
        print("API Key: ", api_key)   # print api key

        is_valid = validate_company_name_gpt(prompt, modality, api_key)
        if not is_valid:
            raise ValueError(f"Invalid company name: {prompt}")

        if modality == "business analyst":
            identity = f"business analysis"
            intro_sentence = f"This preliminary business analysis of {prompt} has identified the following key insights:"
            user_prompt = f"Please generate a response about {prompt} from the perspective of a business analyst. Start with this introduction sentence: '{intro_sentence}' Then list the most important business analysis insights using the bullet point format • "
        elif modality == "financial":
            identity = f"a financial analyst with a PhD in Financial Mathematics from MIT who works for Goldman Sachs"
            intro_sentence = f"This preliminary financial analysis of {prompt} reports upon its assets and liabilities, cashflows and liquidity, and provides 4 key ratios for the company:"
            user_prompt = f"""Please generate a response about {prompt} from the perspective of an financial analyst. Start with this introduction sentence: '{intro_sentence}'.  
            ASSETS & LIABILITIES
            List 4 recent and most important asset and liability facts for {prompt} using the bullet point format •
            CASHFLOWS & LIQUIDITY
            List 4 recent insights regarding cashflows and liquidity information for {prompt} using the bullet point format •
            KEY FINANCIAL RATIOS
            List the 4 most important financial ratios for {prompt} using the bullet point format •
            """
        elif modality == "investigator":
            identity = f"investigative"
            intro_sentence = f"This preliminary investigation of {prompt} has examined general investigative, corporate, and compliance information, and compiled the following results:"
            user_prompt = f"""Please generate a response about {prompt} from the perspective of an investigator. Start with this introduction sentence: '{intro_sentence}'.
            GENERAL INVESTIGATIVE INFORMATION
            List 4 things that recent investigations have revealed for {prompt} using the bullet point format •
            CORPORATE INFORMATION
            List the 4 most important corporate facts for {prompt} using the bullet point format •
            COMPLIANCE INFORMATION
            List the 4 most important compliance findings for {prompt} using the bullet point format •
            """
        elif modality == "due diligence":
            identity = f"due diligence"
            intro_sentence = f"""FTI has conducted due diligence into {prompt} and has examined:
            • General
            • Corporate
            • Compliance
            • Relationships between {prompt} and its subsidiaries and directors
            • Indications of financial distress
            • Involvement in litigation and disputes
            • {prompt}'s profile and media coverage

            The following results have been compiled:"""
            user_prompt = f"""
            You are an AI trained by OpenAI, specialized in conducting due diligence for companies. Your task is to provide a comprehensive investigation report about {prompt} which includes the following sections:

            1. General: List 4 key findings from recent investigations.
            2. Corporate: List 4 critical corporate facts.
            3. Compliance: Describe regulatory notices, sanction, embargo, and financial enforcements against {prompt} and its subsidiaries or directors citing 4 recent cases.
            4. Relationships: Describe 4 important relationships between {prompt} and its subsidiaries or directors or associated off-shore companies.
            5. Financial Distress Indicators:
                - Assets & Liabilities: List 4 recent and critical facts.
                - Cashflows & Liquidity: List 4 recent and critical key metrics.
                - Key Financial Ratios: List 4 recent and critical financial ratios.
            6. Litigation & Disputes: Describe litigation or bankruptcy proceedings against {prompt} and its subsidiaries or directors citing 4 recent cases.
            7. Profile and media: Summarize 4 recent high profile media or social media commentaries.

            Use the bullet point format • to structure your findings in each section and start with this sentence: '{intro_sentence}'.
            """
        else:
            raise ValueError("Modality must be one of 'business analyst', 'investigator', 'financial analyst', or 'due diligence.")
        
        openai.api_key = api_key

        def create_chat_completion():
            return openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": f"You are an AI trained to provide detailed and accurate {identity} information about companies."},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=1500,
                n=1,
                stop=None,
                temperature=0,  # Decrease temperature to make output more conservative. NB: 0.2 works nicely. 0 ensures reproducibility.
            )

        # Create the chat completion
        response = create_chat_completion()

        print("GPT-4 Response:", response)  # print statements to see the values of variables and the response from the GPT-4 API

        final_response = response['choices'][0]['message']['content']
        return final_response.strip()

    # part of try/except block, here the except block catches error and prints it to the terminal
    except Exception as e:
        print(f"An error occurred: {str(e)}")
