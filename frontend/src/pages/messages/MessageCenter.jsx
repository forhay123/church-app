import React, { useState, useEffect } from 'react';
import {
    fetchInbox,
    fetchUserProfile,
    fetchUsersByRole,
    respondToMessage,
    fetchRoleTargets,
    addMessage,
    getContentTypes,
} from '@utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    ChevronDown,
    ChevronUp,
    UserCheck,
    UserX,
    Send,
    ChevronsUpDown,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/**
 * A reusable multi-select component for roles.
 * It uses shadcn/ui components to create a dropdown with checkboxes.
 */
const RoleMultiSelect = ({ selectedRoles, onRoleChange, availableRoles }) => {
    const [open, setOpen] = useState(false);

    const handleToggleRole = (roleName) => {
        const isSelected = selectedRoles.includes(roleName);
        if (isSelected) {
            onRoleChange(selectedRoles.filter((r) => r !== roleName));
        } else {
            onRoleChange([...selectedRoles, roleName]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {selectedRoles.map((role) => (
                                <Badge key={role} variant="secondary">
                                    {role}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        'Select roles...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search roles..." />
                    <CommandEmpty>No roles found.</CommandEmpty>
                    <CommandGroup>
                        {availableRoles.map((role) => (
                            <CommandItem
                                key={role.name}
                                onSelect={(value) => {
                                    handleToggleRole(value);
                                }}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    checked={selectedRoles.includes(role.name)}
                                    onCheckedChange={() => handleToggleRole(role.name)}
                                />
                                <span className="cursor-pointer">{role.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

/**
 * A component for composing and sending messages.
 */
const MessageComposer = ({ onMessageSent }) => {
    const { toast } = useToast();
    const [messageText, setMessageText] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedType, setSelectedType] = useState('TEXT');
    const [selectedFile, setSelectedFile] = useState(null);
    const [targetRoles, setTargetRoles] = useState([]);
    const [contentTypes, setContentTypes] = useState([]);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const currentUser = await fetchUserProfile();
                const rolePermissions = await fetchRoleTargets(currentUser.role);
                const roles = rolePermissions.map(p => ({ name: p.target_role }));
                setTargetRoles(roles);

                const fetchedContentTypes = await getContentTypes();
                const formattedContentTypes = fetchedContentTypes.map(type => ({
                    value: type,
                    label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
                }));
                setContentTypes(formattedContentTypes);
            } catch (err) {
                toast({
                    title: 'Error loading data.',
                    description: err.message,
                    variant: 'destructive',
                });
            }
        };
        loadData();
    }, [toast]);

    const handleSendMessage = async () => {
        if (selectedRoles.length === 0) {
            toast({
                title: 'Missing information.',
                description: 'Please select at least one recipient role.',
                variant: 'destructive',
            });
            return;
        }

        if (selectedType === 'TEXT' && !messageText) {
            toast({
                title: 'Missing information.',
                description: 'Please enter a message.',
                variant: 'destructive',
            });
            return;
        }

        if (selectedType !== 'TEXT' && !selectedFile) {
            toast({
                title: 'Missing file.',
                description: 'Please upload a file for the selected content type.',
                variant: 'destructive',
            });
            return;
        }

        setIsSending(true);
        try {
            const formData = new FormData();
            selectedRoles.forEach(role => {
                formData.append('receiver_roles', role);
            });

            formData.append('content_type', selectedType);

            if (selectedType === 'TEXT') {
                formData.append('text', messageText);
            } else {
                formData.append('file', selectedFile);
            }

            await addMessage(formData);
            toast({
                title: 'Message sent!',
                description: 'Your message has been successfully sent.',
                variant: 'success',
            });
            setMessageText('');
            setSelectedFile(null);
            setSelectedRoles([]);
            onMessageSent();
        } catch (err) {
            toast({
                title: 'Failed to send message.',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-teal-600">Compose New Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="recipient">Send to Roles:</Label>
                    <RoleMultiSelect
                        selectedRoles={selectedRoles}
                        onRoleChange={setSelectedRoles}
                        availableRoles={targetRoles}
                    />
                </div>
                <div>
                    <Label htmlFor="content-type">Content Type:</Label>
                    <Select onValueChange={setSelectedType} value={selectedType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                            {contentTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedType === 'TEXT' ? (
                    <div>
                        <Label htmlFor="message">Message:</Label>
                        <Textarea
                            id="message"
                            placeholder="Type your message here..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                        />
                    </div>
                ) : (
                    <div>
                        <Label htmlFor="file">Upload File:</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                        />
                    </div>
                )}
                <Button onClick={handleSendMessage} disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send Message'}
                    <Send className="ml-2 w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
    );
};


const SentMessageDetails = ({ message }) => {
    const [expandedRoles, setExpandedRoles] = useState({});
    const [roleStatus, setRoleStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const getAcknowledgmentStatus = async () => {
            const statusByRole = {};
            const receiverRoles = Array.isArray(message.receiver_roles) ? message.receiver_roles : [message.receiver_roles];
            
            const acknowledgedUserNames = new Set(
                message.responses.filter((r) => r.acknowledged).map((r) => r.responder)
            );

            for (const role of receiverRoles) {
                try {
                    const users = await fetchUsersByRole(role);
                    const acknowledged = [];
                    const unacknowledged = [];

                    users.forEach((user) => {
                        if (acknowledgedUserNames.has(user.name)) {
                            acknowledged.push(user.name);
                        } else {
                            unacknowledged.push(user.name);
                        }
                    });

                    statusByRole[role] = { acknowledged, unacknowledged };
                } catch (err) {
                    toast({
                        title: `Could not fetch users for role: ${role}.`,
                        description: err.message,
                        variant: 'destructive',
                    });
                    statusByRole[role] = { acknowledged: [], unacknowledged: [] };
                }
            }
            setRoleStatus(statusByRole);
            setLoading(false);
        };
        getAcknowledgmentStatus();
    }, [message, toast]);

    const handleToggleRole = (role) => {
        setExpandedRoles((prev) => ({
            ...prev,
            [role]: !prev[role],
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center text-sm text-gray-500 mt-4">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.965l3-2.674z"></path>
                </svg>
                Loading status...
            </div>
        );
    }

    return (
        <div className="mt-4 border-t pt-4">
            <p className="font-bold">Acknowledgment Status:</p>
            {Object.entries(roleStatus).map(([role, status]) => (
                <div key={role} className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{role}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleRole(role)}
                        >
                            <span className="mr-1 text-gray-600">
                                {status.acknowledged.length} / {status.acknowledged.length + status.unacknowledged.length}
                            </span>
                            {expandedRoles[role] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                    {expandedRoles[role] && (
                        <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                            {status.acknowledged.length > 0 && (
                                <div className="flex flex-wrap items-center">
                                    {status.acknowledged.map((name) => (
                                        <Badge key={name} className="mr-2 mb-2 bg-green-100 text-green-800">
                                            <UserCheck className="w-3 h-3 mr-1" /> {name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {status.unacknowledged.length > 0 && (
                                <div className="flex flex-wrap items-center">
                                    {status.unacknowledged.map((name) => (
                                        <Badge key={name} className="mr-2 mb-2 bg-red-100 text-red-800">
                                            <UserX className="w-3 h-3 mr-1" /> {name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {status.acknowledged.length === 0 && status.unacknowledged.length === 0 && (
                                <p className="text-sm text-gray-500">No users found for this role.</p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

/**
 * Renders the Message Center component, which displays sent and received messages.
 * It also handles message acknowledgment and displays the acknowledgment status for sent messages.
 */
const MessageCenter = () => {
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const user = await fetchUserProfile();
            setCurrentUser(user);
            const fetchedMessages = await fetchInbox();
            setMessages(fetchedMessages);
        } catch (err) {
            toast({
                title: 'Error loading messages.',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const handleAcknowledge = async (messageId) => {
        try {
            await respondToMessage(messageId, 'ACKNOWLEDGED');
            toast({
                title: 'Message acknowledged.',
                description: 'Thank you for your response.',
                variant: 'success',
            });
            loadMessages();
        } catch (err) {
            toast({
                title: 'Failed to acknowledge message.',
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    const getMessageDetails = (message) => {
        switch (message.content_type) {
            case 'TEXT':
                return <p className="mt-2 text-gray-700">{message.text}</p>;
            case 'Image':
                return (
                    <img
                        src={message.content_url}
                        alt="Message content"
                        className="mt-2 rounded-lg max-w-full"
                    />
                );
            case 'Video':
                return (
                    <video controls className="mt-2 rounded-lg max-w-full">
                        <source src={message.content_url} />
                        Your browser does not support the video tag.
                    </video>
                );
            case 'PDF':
                return (
                    <a
                        href={message.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-blue-600 hover:underline"
                    >
                        View PDF Document
                    </a>
                );
            case 'Poll':
                try {
                    const pollData = JSON.parse(message.text);
                    return (
                        <div className="mt-2">
                            <p className="font-bold">{pollData.question}</p>
                            <ul className="list-none space-y-1 mt-2">
                                {pollData.options.map((option, index) => (
                                    <li key={index} className="text-sm">
                                        - {option}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                } catch (e) {
                    return <p className="text-red-500">Poll data corrupted.</p>;
                }
            default:
                return <p>Unsupported message type.</p>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <svg className="animate-spin h-10 w-10 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.965l3-2.674z"></path>
                </svg>
                <p className="mt-4 text-lg">Loading messages...</p>
            </div>
        );
    }

    const sentMessages = messages.filter(m => currentUser && m.sender === currentUser.name);
    const receivedMessages = messages.filter(m => currentUser && m.sender !== currentUser.name);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-center text-teal-600">
                Message Center
            </h1>
            <MessageComposer onMessageSent={loadMessages} />
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-blue-800">
                    Sent Messages
                </h2>
                <div className="space-y-4">
                    {sentMessages.length > 0 ? (
                        sentMessages.map((message) => {
                            const receiverRoles = Array.isArray(message.receiver_roles) ? message.receiver_roles : [message.receiver_role];
                            return (
                                <Card key={message.id}>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            <span>
                                                To:
                                                {receiverRoles.map((role) => (
                                                    <Badge key={role} className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">{role}</Badge>
                                                ))}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(message.created_at).toLocaleString()}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {getMessageDetails(message)}
                                        <SentMessageDetails message={{ ...message, receiver_roles: receiverRoles }} />
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500">
                            You haven't sent any messages yet.
                        </p>
                    )}
                </div>
            </section>
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-purple-800">
                    Received Messages
                </h2>
                <div className="space-y-4">
                    {receivedMessages.length > 0 ? (
                        receivedMessages.map((message) => {
                            const hasAcknowledged = message.responses.some(
                                (r) => r.responder === currentUser?.name && r.acknowledged
                            );
                            return (
                                <Card key={message.id}>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            <span>
                                                From: <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{message.sender}</Badge>
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(message.created_at).toLocaleString()}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {getMessageDetails(message)}
                                        <Button
                                            className="mt-4 w-full sm:w-auto"
                                            onClick={() => handleAcknowledge(message.id)}
                                            disabled={hasAcknowledged}
                                        >
                                            {hasAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500">
                            Your inbox is empty.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MessageCenter;