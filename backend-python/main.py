import requests
import time
from datetime import datetime, timedelta
from paper_search import SemanticSearch
from analyser import analyze_paper
from writer import write_newsletter
import logging
import asyncio
from send_email import send_email
import os
from dotenv import load_dotenv
from api_client import ApiClient

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
# Make sure your Node.js backend is running and accessible at this URL.

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
            logging.info(f"Processing newsletter: {newsletter.get('topic', 'N/A')}")
            
            latest_issue = api_client.get_latest_issue(newsletter['_id'])
            if latest_issue:
                # Assuming publicationDate is in ISO format with 'Z' at the end
                last_issue_date = datetime.fromisoformat(latest_issue['publicationDate'].replace('Z', '+00:00'))
                if datetime.now(last_issue_date.tzinfo) - last_issue_date < timedelta(days=7):
                    logging.info(f"Newsletter '{newsletter['topic']}' is up to date. Skipping.")
                    continue
            
            logging.info(f"Creating a new issue for newsletter '{newsletter['topic']}'...")
            
            searcher = SemanticSearch()
            # Search for papers from the last 7 days
            now = datetime.now()
            start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
            end_date = now.strftime("%Y-%m-%d")
            query = newsletter['topic']
            papers = searcher.search(query=query, start_date=start_date, end_date=end_date, nb_papers=20)

            if not papers:
                logging.warning(f"No papers found for topic '{newsletter['topic']}'. Skipping.")
                continue

            analysis_tasks = []
            for paper in papers:
                analysis_tasks.append(analyze_paper(topic=newsletter['topic'], paper=paper))
            
            # Run analysis tasks concurrently
            analyzed_results = await asyncio.gather(*analysis_tasks, return_exceptions=True)

            papers_with_analysis = []
            for paper, result in zip(papers, analyzed_results):
                if isinstance(result, Exception):
                    logging.error(f"Error analyzing paper: {result}")
                elif result:
                    papers_with_analysis.append({"paper": paper, "analysis": result})

            if not papers_with_analysis:
                logging.warning(f"No papers could be analyzed for topic '{newsletter['topic']}'. Skipping.")
                continue

            papers_with_analysis.sort(key=lambda x: x['analysis'].get('score', 0), reverse=True)
            top_5_papers = papers_with_analysis[:5]

            newsletter_data = write_newsletter(topic=newsletter['topic'], papers_with_analysis=top_5_papers)

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
                logging.error(f"Failed to create issue for newsletter {newsletter.get('title', 'N/A')}. Skipping paper creation.")
                continue
            
            issue_id = created_issue['_id']

            # Prepare papers for creation, adding analysis data and issueId
            papers_to_create = []
            for p in top_5_papers:
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

            created_papers = api_client.create_papers(papers_to_create)
            
            # The issue is already created, and papers are linked via issueId. No need to update issue with paper IDs.

            # Send email to the newsletter creator
            user_id = newsletter.get('userId')
            if user_id:
                user_info = api_client.get_user_info(user_id)
                if user_info and user_info.get('email'):
                    user_email = user_info.get('email')
                    user_name = user_info.get('name', 'user') # Default to 'user' if name is not available
                    subject = f"New Issue Available: {newsletter.get('topic')}"
                    issue_link = f"{os.getenv('APP_DOMAIN')}/issues/{issue_id}"
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

        logging.info("Daily newsletter generation cycle finished.")
        await asyncio.sleep(24 * 60 * 60)

if __name__ == "__main__":
    asyncio.run(main())
