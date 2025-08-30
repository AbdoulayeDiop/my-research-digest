from dotenv import load_dotenv

load_dotenv()

import requests
import time
from datetime import datetime, timedelta
from newsletter_creator import NewsletterCreator
import logging
import asyncio
from send_email import send_email
import os
from api_client import ApiClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def create_issue_and_papers(api_client, newsletter, newsletter_data, papers):
    issue_to_create = {
        "title": newsletter_data['title'],
        "publicationDate": datetime.now().isoformat(),
        "summary": newsletter_data['summary'],
        "introduction": newsletter_data['introduction'],
        "conclusion": newsletter_data['conclusion'],
        "contentMarkdown": newsletter_data['content_markdown'],
    }

    created_issue = api_client.create_issue(newsletter['_id'], issue_to_create)
    if not created_issue:
        logging.error(f"Failed to create issue for newsletter {newsletter.get('topic', 'N/A')}. Skipping paper creation.")
        return None
    
    issue_id = created_issue['_id']
    # Prepare papers for creation, adding analysis data and issueId
    papers_to_create = []
    for p in papers:
        paper_data = p['paper']
        analysis_data = p['analysis']
        
        # Extract author names
        author_names = [author['name'] for author in paper_data.get('authors', [])]

        papers_to_create.append({
            'paperId': paper_data.get('paperId'),
            'title': paper_data.get('title'),
            'authors': author_names,
            'publicationDate': paper_data.get('publicationDate'),
            'abstract': paper_data.get('abstract'),
            'url': paper_data.get('url'),
            'synthesis': analysis_data.get('synthesis'),
            'usefulness': analysis_data.get('usefulness'),
            'score': analysis_data.get('score'),
            'issueId': issue_id, # Add the issueId here
            'venueName': (paper_data.get('publicationVenue') or {}).get('name', None)
        })

    api_client.create_papers(papers_to_create)
    return created_issue

async def process_newsletter(api_client, newsletter):
    logging.info(f"Processing newsletter: {newsletter.get('topic', 'N/A')}")
    
    latest_issue = api_client.get_latest_issue(newsletter['_id'])
    if latest_issue:
        # Assuming publicationDate is in ISO format with 'Z' at the end
        last_issue_date = datetime.fromisoformat(latest_issue['publicationDate'].replace('Z', '+00:00'))
        if datetime.now(last_issue_date.tzinfo) - last_issue_date < timedelta(days=7):
            logging.info(f"Newsletter '{newsletter['topic']}' is up to date. Skipping.")
            return
    
    logging.info(f"Creating a new issue for newsletter '{newsletter['topic']}'...")
    
    now = datetime.now()
    start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = now.strftime("%Y-%m-%d")
    result = await NewsletterCreator().create_newsletter(newsletter['topic'], start_date, end_date=end_date)
    if result['status'] != 'success':
        logging.error(f"Failed to create newsletter for topic {newsletter['topic']}. Skipping.")
        return
    newsletter_data = result['newsletter']
    papers = result['papers']

    if len(papers) == 0:
        logging.warning(f"No papers found for topic '{newsletter['topic']}'. Skipping.")
        return

    created_issue = create_issue_and_papers(api_client, newsletter, newsletter_data, papers)
    
    # The issue is already created, and papers are linked via issueId. No need to update issue with paper IDs.

    # Send email to the newsletter creator
    user_id = newsletter.get('userId')
    if user_id:
        user_info = api_client.get_user_info(user_id)
        if user_info and user_info.get('email'):
            user_email = user_info.get('email')
            user_name = user_info.get('name', 'user') # Default to 'user' if name is not available
            subject = f"New Issue Available: {newsletter.get('topic')}"
            issue_link = f"{os.getenv('APP_DOMAIN')}/issues/{created_issue['_id']}"
            body = f"""
                <p>Dear {user_name},</p>
                <p>A new issue for your newsletter on topic <strong>{newsletter.get('topic')}</strong> is now available.</p>
                <p><strong>Summary:</strong></p>
                <p>{created_issue.get('summary')}</p>
                <p>Read the issue here: <a href="{issue_link}">{issue_link}</a></p>
                <p>Best regards,</p>
                <p>The My Research Digest Team</p>
            """
            send_email(subject, body, user_email, is_html=True)
        else:
            logging.warning(f"Could not retrieve email for user {user_id} of newsletter {newsletter.get('topic')}")
    else:
        logging.warning(f"No userId found for newsletter {newsletter.get('topic')}")

async def main():
    """Main function to run the newsletter generation cycle."""
    api_client = ApiClient(os.getenv('NODE_API_BASE_URL'))
    while True:
        logging.info("Starting daily newsletter generation cycle...")
        
        newsletters = api_client.get_newsletters()
        if not newsletters:
            logging.warning("No newsletters found. Retrying in 24 hours.")
            await asyncio.sleep(24 * 60 * 60)
            continue

        for newsletter in newsletters:
            await process_newsletter(api_client, newsletter)

        logging.info("Daily newsletter generation cycle finished.")
        await asyncio.sleep(24 * 60 * 60)

if __name__ == "__main__":
    asyncio.run(main())
