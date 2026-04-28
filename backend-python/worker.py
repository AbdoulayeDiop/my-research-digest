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
            'score': paper_data.get('score'),
            'issueId': issue_id,  # Add the issueId here
            'venueName': (paper_data.get('publicationVenue') or {}).get('name', None)
        })

    api_client.create_papers(papers_to_create)
    return created_issue


async def check_newsletter_inactivity(api_client, newsletter):
    """Warn or disable a newsletter based on consecutive unread issues."""
    newsletter_id = newsletter['_id']
    user_id = newsletter.get('userId')
    topic = newsletter.get('topic', 'N/A')

    if not user_id:
        return

    unread_count = api_client.get_consecutive_unread_count(newsletter_id, user_id)
    if unread_count is None:
        return

    warning_sent = newsletter.get('inactivityWarningSentAt')

    # Re-engagement: user read something after a warning was sent
    if unread_count < 3 and warning_sent:
        api_client.update_newsletter(newsletter_id, {'inactivityWarningSentAt': None})
        return

    user_info = api_client.get_user_info(user_id)
    user_email = user_info.get('email') if user_info else None
    user_name = user_info.get('name', 'user') if user_info else 'user'

    if unread_count >= 4:
        logging.info(f"Disabling newsletter '{topic}' due to 4 consecutive unread issues.")
        api_client.update_newsletter(newsletter_id, {'status': 'inactive', 'inactivityWarningSentAt': None})
        if user_email:
            subject = f"Your newsletter on \"{topic}\" has been paused"
            body = f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>Dear {user_name},</p>
                    <p>Your newsletter on <strong>{topic}</strong> has been automatically paused.</p>
                    <p>Since the last 4 issues went unread, we've stopped generating new ones to avoid producing content you don't need right now.</p>
                    <p>Whenever you're ready to pick it back up, just reactivate it from your dashboard — all your past issues are still there.</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{os.getenv('APP_DOMAIN')}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Reactivate Newsletter
                        </a>
                    </p>
                    <p>Best regards,<br>The My Research Digest Team</p>
                </div>
            """
            send_email(subject, body, user_email, is_html=True)

    elif unread_count == 3 and not warning_sent:
        logging.info(f"Sending inactivity warning for newsletter '{topic}'.")
        api_client.update_newsletter(newsletter_id, {'inactivityWarningSentAt': datetime.now().isoformat()})
        if user_email:
            subject = f"Your newsletter on \"{topic}\" will be paused next week"
            body = f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>Dear {user_name},</p>
                    <p>The last 3 issues of your newsletter on <strong>{topic}</strong> have gone unread, so we'll automatically pause it after the next issue to avoid generating content you don't need.</p>
                    <p>If you'd like to keep receiving it, simply read one of your recent issues. If you no longer need it, you can delete it from your settings — no action needed to pause it.</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{os.getenv('APP_DOMAIN')}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Go to Dashboard
                        </a>
                    </p>
                    <p>Best regards,<br>The My Research Digest Team</p>
                </div>
            """
            send_email(subject, body, user_email, is_html=True)


async def process_newsletter(api_client, newsletter):
    logging.info(f"Processing newsletter: {newsletter.get('topic', 'N/A')}")

    if newsletter.get('status') == 'inactive':
        logging.info(f"Newsletter '{newsletter.get('topic')}' is inactive. Skipping.")
        return

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

    queries = newsletter.get('queries', [])
    ranking_strategy = newsletter.get('rankingStrategy', 'author_based')
    filters = newsletter.get('filters', {})

    result = await NewsletterCreator(api_client=api_client).create_newsletter(
        newsletter['topic'], 
        start_date, 
        description=newsletter.get('description', ""),
        end_date=end_date,
        queries=queries,
        ranking_strategy=ranking_strategy,
        filters=filters,
        newsletter_id=newsletter['_id']
    )
    
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
            feedback_section = ""
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

            sig_useful = hmac.new(
                URL_SIGNATURE_SECRET.encode('utf-8'),
                f"{issue_id_str}{user_id_str}useful".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            sig_not_useful = hmac.new(
                URL_SIGNATURE_SECRET.encode('utf-8'),
                f"{issue_id_str}{user_id_str}not_useful".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            base = f"{os.getenv('APP_DOMAIN')}/api/public/issues/{issue_id_str}/feedback?userId={user_id_str}"
            feedback_section = f"""
                <div style="text-align: center; margin-top: 24px; border-top: 1px solid #eee; padding-top: 20px;">
                    <p style="margin-bottom: 12px; color: #555; font-size: 0.95em;">Was this issue useful?</p>
                    <a href="{base}&rating=useful&signature={sig_useful}" style="background-color: #4f46e5; color: white; padding: 10px 22px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                        Yes, it was
                    </a>
                    <a href="{base}&rating=not_useful&signature={sig_not_useful}" style="background-color: #e5e7eb; color: #374151; padding: 10px 22px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Not really
                    </a>
                </div>
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
            {feedback_section}
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
            if newsletter.get('status') == 'active':
                await check_newsletter_inactivity(api_client, newsletter)
            await process_newsletter(api_client, newsletter)

        logging.info("Daily newsletter generation cycle finished.")
        await asyncio.sleep(24 * 60 * 60)

if __name__ == "__main__":
    asyncio.run(main())
