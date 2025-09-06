# Use official Nginx image
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx config into the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Render assigns
EXPOSE 8080

# Start Nginx in foreground (so container doesn’t exit)
CMD ["nginx", "-g", "daemon off;"]
