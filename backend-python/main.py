from dotenv import load_dotenv
load_dotenv()
from api_client import ApiClient
import os
from send_email import send_email
import asyncio
import logging
from newsletter_creator import NewsletterCreator
from datetime import datetime, timedelta
import time
import requests
import hmac
import hashlib

URL_SIGNATURE_SECRET = os.getenv('URL_SIGNATURE_SECRET')


# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')


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
        logging.error(
            f"Failed to create issue for newsletter {newsletter.get('topic', 'N/A')}. Skipping paper creation.")
        return None

    issue_id = created_issue['_id']
    # Prepare papers for creation, adding analysis data and issueId
    papers_to_create = []
    for p in papers:
        paper_data = p['paper']
        analysis_data = p['analysis']

        # Extract author names
        author_names = [author['name']
                        for author in paper_data.get('authors', [])]

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
            'issueId': issue_id,  # Add the issueId here
            'venueName': (paper_data.get('publicationVenue') or {}).get('name', None)
        })

    api_client.create_papers(papers_to_create)
    return created_issue


async def process_newsletter(api_client, newsletter):
    logging.info(f"Processing newsletter: {newsletter.get('topic', 'N/A')}")

    last_search = newsletter.get('lastSearch')
    
    # If lastSearch is missing, try to get the date from the latest issue
    if not last_search:
        latest_issue = api_client.get_latest_issue(newsletter['_id'])
        if latest_issue:
            last_search = latest_issue.get('publicationDate') or latest_issue.get('createdAt')
            logging.info(f"Using latest issue date as last search date: {last_search}")
        else:
            logging.info(f"No previous search or issues found for newsletter '{newsletter.get('topic')}'. Proceeding to search.")

    if last_search:
        # Assuming lastSearch/date is in ISO format
        try:
            last_search_date = datetime.fromisoformat(
                last_search.replace('Z', '+00:00'))
            if datetime.now(last_search_date.tzinfo) - last_search_date < timedelta(days=7):
                logging.info(
                    f"Newsletter '{newsletter['topic']}' was processed recently (based on last search or latest issue). Skipping.")
                return
        except (ValueError, TypeError) as e:
            logging.error(f"Error parsing date '{last_search}' for newsletter {newsletter.get('topic')}: {e}")
            # If date is unparseable, we continue processing to be safe

    logging.info(
        f"Searching for new papers for newsletter '{newsletter['topic']}'...")

    # Update lastSearch date immediately to avoid duplicate processing
    api_client.update_newsletter(
        newsletter['_id'], {'lastSearch': datetime.now().isoformat()})

    now = datetime.now()
    start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = now.strftime("%Y-%m-%d")

    # Get user info for emails
    user_id = newsletter.get('userId')
    user_email = None
    user_name = 'user'
    if user_id:
        user_info = api_client.get_user_info(user_id)
        if user_info:
            user_email = user_info.get('email')
            user_name = user_info.get('name', 'user')

    result = await NewsletterCreator().create_newsletter(newsletter['topic'], start_date, end_date=end_date)
    
    if not result or len(result.get('papers', [])) == 0:
        logging.warning(
            f"No papers found for topic '{newsletter['topic']}'.")
        if user_email:
            subject = f"Update: No new papers for {newsletter.get('topic')}"
            body = f"""
                <p>Dear {user_name},</p>
                <p>We searched for new research papers for your newsletter on <strong>{newsletter.get('topic')}</strong>, but didn't find any new relevant publications in the past week.</p>
                <p>This can happen if the topic is very specific or if there hasn't been much new research in that niche recently.</p>
                
                <p><strong>What you can try:</strong></p>
                <ul>
                    <li>Consider creating a new newsletter with a broader topic to capture more results.</li>
                    <li>No action is needed if you'd like to wait. We'll continue to search for you weekly!</li>
                </ul>
                
                <p>You can create a new newsletter from your dashboard:</p>
                <p><a href="{os.getenv('APP_DOMAIN')}">Go to Dashboard</a></p>

                <p>Best regards,</p>
                <p>The My Research Digest Team</p>
            """
            send_email(subject, body, user_email, is_html=True)
        return

    newsletter_data = result['newsletter']
    papers = result['papers']

    logging.info(
        f"Creating a new issue for newsletter '{newsletter['topic']}'...")
    created_issue = create_issue_and_papers(
        api_client, newsletter, newsletter_data, papers)

    if not created_issue:
        return

    # Send email to the newsletter creator with full content
    if user_email:
        subject = f"New Issue Available: {newsletter.get('topic')} - {created_issue.get('title')}"
        issue_link = f"{os.getenv('APP_DOMAIN')}/issues/{created_issue['_id']}"
        
        # Generate signed URL for "Mark as Read"
        issue_id_str = str(created_issue['_id'])
        user_id_str = str(user_id)
        
        if not URL_SIGNATURE_SECRET:
            logging.error("URL_SIGNATURE_SECRET environment variable not set. Cannot generate signed URLs.")
            mark_as_read_section = ""
        else:
            data_to_sign = f"{issue_id_str}{user_id_str}"
            signature = hmac.new(
                URL_SIGNATURE_SECRET.encode('utf-8'),
                data_to_sign.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            mark_as_read_link = f"{os.getenv('APP_DOMAIN')}/api/public/issues/{issue_id_str}/mark-as-read?userId={user_id_str}&signature={signature}"
            mark_as_read_section = f"""
                <p style="text-align: center; margin-top: 20px;">
                    <a href="{mark_as_read_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-weight: bold;">
                        Mark as Read
                    </a>
                </p>
            """

        # Construct the full issue body in HTML
        papers_html = ""
        for i, p in enumerate(papers):
            paper_data = p['paper']
            analysis = p['analysis']
            authors = ", ".join([author.get('name', 'N/A') for author in paper_data.get('authors', [])])
            venue = (paper_data.get('publicationVenue') or {}).get('name')
            author_line = f"by {authors}"
            if venue:
                author_line += f" ({venue})"
            
            papers_html += f"""
                <div style="border: 1px solid #eee; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="font-size: 1.1em; margin-bottom: 5px;">{i+1}. {paper_data.get('title')}</h3>
                    <p style="font-style: italic; color: #555; margin-top: 0;">{author_line}</p>
                    
                    <h4 style="font-weight: bold; margin-bottom: 5px;">Synthesis</h4>
                    <p>{analysis.get('synthesis')}</p>

                    <h4 style="font-weight: bold; margin-bottom: 5px;">Why it matters?</h4>
                    <p>{analysis.get('usefulness')}</p>

                    <a href="{paper_data.get('url')}" style="font-weight: bold; text-decoration: none;">Read the full paper &rarr;</a>
                </div>
            """

        body = f"""
            <p>Dear {user_name},</p>
            <p>Your latest My Research Digest issue on topic <strong>{newsletter.get('topic')}</strong> is ready! We've summarized the latest papers for you below.</p>
            <hr>
            <h1>{created_issue.get('title')}</h1>
            
            <h2>Introduction</h2>
            <div>{created_issue.get('introduction').replace('\n', '<br>')}</div>
            
            <h2>Featured Research Papers</h2>
            {papers_html}
            
            <h2>Conclusion</h2>
            <div>{created_issue.get('conclusion').replace('\n', '<br>')}</div>
            
            <hr>
            <p>You can also view the full issue on your dashboard: <a href="{issue_link}">{issue_link}</a></p>
            {mark_as_read_section}
            <p>Best regards,</p>
            <p>The My Research Digest Team</p>
        """
        send_email(subject, body, user_email, is_html=True)
    else:
        logging.warning(
            f"No email found for user {user_id} of newsletter {newsletter.get('topic')}")


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
