import gradio as gr
from dotenv import load_dotenv
import os
from transformers import BlenderbotTokenizer, BlenderbotForConditionalGeneration
import torch

# Load environment variables at startup
load_dotenv()

# Initialize the model and tokenizer
print("Loading the model (this might take a minute the first time)...")
model_name = "facebook/blenderbot-400M-distill"
tokenizer = BlenderbotTokenizer.from_pretrained(model_name)
model = BlenderbotForConditionalGeneration.from_pretrained(model_name)

def chat_with_ai(message, history):
    """Chat using Blenderbot model"""
    if not message.strip():  # Check if message is empty
        return history
    
    try:
        # Prepare conversation context
        conversation = message
        if history:
            # Add last message for context
            last_message = history[-1][1]  # Get last assistant response
            conversation = last_message + " " + message
        
        # Tokenize and generate response
        inputs = tokenizer([conversation], return_tensors="pt", truncation=True, max_length=512)
        reply_ids = model.generate(
            **inputs,
            max_length=128,
            min_length=8,
            do_sample=True,
            top_k=50,
            top_p=0.9,
            temperature=0.7,
            num_return_sequences=1
        )
        
        # Decode the response
        response = tokenizer.batch_decode(reply_ids, skip_special_tokens=True)[0]
        
        # Return history with new message pair as a list of tuples
        return history + [[message, response]]
            
    except Exception as e:
        error_message = f"Error: {str(e)}"
        print(f"Error details: {error_message}")  # For debugging
        return history + [[message, "I apologize, but I'm having trouble right now. Please try again."]]

def clear_chat():
    return []

# Create the Gradio interface
with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # AI Chat Assistant
    This chatbot uses the Blenderbot model, which is designed for engaging conversations.
    Try asking questions or having a casual chat!
    """)
    
    chatbot = gr.Chatbot(
        value=[],
        label="Chat History",
        height=400,
        bubble_full_width=False
    )
    
    with gr.Row():
        with gr.Column(scale=8):
            msg = gr.Textbox(
                label="Your Message",
                placeholder="Type your message here and press Enter to send...",
                lines=2,
                show_label=False,
                container=False
            )
        with gr.Column(scale=1):
            submit_btn = gr.Button("Send", variant="primary")
    
    clear = gr.Button("Clear Chat")
    
    # Set up event handlers
    msg.submit(
        chat_with_ai,
        [msg, chatbot],
        [chatbot]
    ).then(
        lambda: "",  # Clear input after sending
        None,
        [msg]
    )
    
    submit_btn.click(
        chat_with_ai,
        [msg, chatbot],
        [chatbot]
    ).then(
        lambda: "",  # Clear input after sending
        None,
        [msg]
    )
    
    clear.click(clear_chat, None, chatbot)
    
    # Add some example messages
    gr.Examples(
        examples=[
            "Hi, how are you today?",
            "Can you tell me an interesting fact?",
            "What's your favorite book and why?",
            "How do you feel about artificial intelligence?",
        ],
        inputs=msg
    )

if __name__ == "__main__":
    # Launch the interface
    print("Starting the chat interface...")
    demo.launch(
        server_port=7860,
        share=False,
        show_error=True
    )

