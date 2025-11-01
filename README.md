# Skolų Departamentas (Debt Management System)

A comprehensive debt management and expense tracking application built with Next.js 16, React 19, and TypeScript.

## Features

- **User & Group Management**: Create groups, invite members, manage permissions (Admin, Member, Guest)
- **Expense Tracking**: Add, edit, and delete expenses with category support
- **Currency Conversion**: Real-time currency exchange rates
- **Payment History**: Track all payments between members
- **Messaging**: Group chat and personal messaging between friends
- **Notifications**: Real-time notifications for expenses, payments, and messages
- **Reports**: Detailed financial reports with export functionality
- **Multi-language**: English and Lithuanian language support
- **Authentication**: Mock authentication system (ready for real implementation)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager

### Installation

1. **Download the project**
   - Download and extract the ZIP file
   - Or clone from GitHub if available

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

4. **Open in browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - The app will automatically reload when you make changes

### Running in VS Code

1. **Open the project**
   \`\`\`bash
   code .
   \`\`\`

2. **Install recommended extensions** (optional but recommended):
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense

3. **Run from VS Code terminal**
   - Open terminal: `Ctrl+` ` (backtick) or `View > Terminal`
   - Run: `npm run dev`

4. **Debug in VS Code** (optional):
   - Press `F5` or go to `Run > Start Debugging`
   - Select "Next.js: debug full stack" if prompted

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── groups/            # Group pages
│   ├── messages/          # Messaging pages
│   ├── friends/           # Friends management
│   ├── notifications/     # Notifications center
│   ├── login/             # Authentication pages
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── contexts/             # React contexts (Auth, Language)
├── lib/                  # Utilities and mock data
├── services/             # API client
├── types/                # TypeScript type definitions
└── public/               # Static assets
\`\`\`

## Mock Data

The application currently uses mock data for demonstration purposes. All mock data is located in `lib/mock-data.ts`.

### Default Users

- **Alex** (alex@example.com) - Admin of multiple groups
- **Sarah** (sarah@example.com)
- **Mike** (mike@example.com)
- **Jordan** (jordan@example.com)
- **Emma** (emma@example.com)
- **Taylor** (taylor@example.com)
- **Chris** (chris@example.com)

### Login

Use any email/password combination to login (mock authentication). The system will automatically log you in as "Alex" for testing purposes.

## Real Implementation

The codebase includes detailed comments showing how to implement real features:

### Database (Supabase)

\`\`\`typescript
// Example: Creating a group
const { data, error } = await supabase
  .from('groups')
  .insert({ title, created_by: user.id })
  .select()
  .single()
\`\`\`

### Authentication

\`\`\`typescript
// Example: Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
\`\`\`

### Real-time Features

\`\`\`typescript
// Example: Subscribe to group messages
const channel = supabase
  .channel('group-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'group_messages',
    filter: `group_id=eq.${groupId}`
  }, (payload) => {
    // Handle new message
  })
  .subscribe()
\`\`\`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **date-fns** - Date formatting
- **Lucide React** - Icons

## Future Enhancements

- [ ] Connect to real database (Supabase/Neon)
- [ ] Implement real authentication (OAuth, email/password)
- [ ] Add real-time messaging with WebSockets
- [ ] Implement push notifications
- [ ] Add file attachments for receipts
- [ ] Export reports to PDF/Excel
- [ ] Mobile app (React Native)

## Support

For issues or questions, please check the code comments or create an issue in the repository.

## License

This project is for educational purposes.
