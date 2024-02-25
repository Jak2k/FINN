# FINN - Automatic Video Generation

*FINN* is a tool for automatic **video** generation **from `markdown`** files.

- [Hello World! - YouTube](https://youtu.be/5B-SlP28P64)
- [Install Rust - YouTube](https://youtu.be/y0IkWczJrv4)

## Features

- Images from markdown files
- AI voiceover
- Automatic cutting
- Compression
- Customizable
  - Style using CSS
  - Voice by changing `voice_sample.wav`

### Commands

- Start interactive CLI: `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True pnpm start <video_name>` (video_name is the name of the subfolder in `videos`)
  - Example: `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True pnpm start hello_world`
  - Available commands in the CLI:
    - `render` - Render and generate everything
    - `regen` - Regenerate a chapter
    - `join` - Join all chapters into a single video
    - `exit` - Exit the CLI
