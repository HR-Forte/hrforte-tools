#!/bin/bash

# Migration script for TypeScript migrations
# Usage: ./scripts/migrate.sh [build|up|down|status|new] [additional_args...]

COMMAND=${1:-"up"}
shift  # Remove the first argument (command) from the argument list
ADDITIONAL_ARGS="$@"  # Capture all remaining arguments

echo "🔧 Migration script - Command: $COMMAND"
if [ ! -z "$ADDITIONAL_ARGS" ]; then
    echo "📝 Additional arguments: $ADDITIONAL_ARGS"
fi

case $COMMAND in
    "build")
        echo "🔨 Building TypeScript migration files..."
        bun build src/lib/database/migrations/*.ts --outdir src/lib/database/migrations --target node
        if [ $? -eq 0 ]; then
            echo "✅ Migration files built successfully"
        else
            echo "❌ Failed to build migration files"
            exit 1
        fi
        ;;
    "up")
        echo "🔨 Building and running migration up..."
        bun build src/lib/database/migrations/*.ts --outdir src/lib/database/migrations --target node

        if [ $? -eq 0 ]; then
            echo "✅ Migration files built successfully"
            echo "🚀 Running migration up..."
            
            # Pass additional arguments to the migration command
            if [ ! -z "$ADDITIONAL_ARGS" ]; then
                bun run src/lib/database/migrations/index.ts up $ADDITIONAL_ARGS
            else
                bun run src/lib/database/migrations/index.ts up
            fi

            # Clean up JavaScript files built from TypeScript
            echo "🧹 Cleaning up JavaScript files"
            rm -f src/lib/database/migrations/*.js
        else
            echo "❌ Failed to build migration files"
            exit 1
        fi
        ;;
    "down")
       echo "🔨 Building and running migration down..."
        bun build src/lib/database/migrations/*.ts --outdir src/lib/database/migrations --target node

        if [ $? -eq 0 ]; then
            echo "✅ Migration files built successfully"
            echo "🚀 Running migration down..."

            # Pass additional arguments to the migration command
            if [ ! -z "$ADDITIONAL_ARGS" ]; then
                bun run src/lib/database/migrations/index.ts down $ADDITIONAL_ARGS
            else
                bun run src/lib/database/migrations/index.ts down
            fi

            # Clean up JavaScript files built from TypeScript
            echo "🧹 Cleaning up JavaScript files..."
            rm -f src/lib/database/migrations/*.js
        else
            echo "❌ Failed to build migration files"
            exit 1
        fi
        ;;
    "status")
        echo "📊 Checking migration status..."
        bun run src/lib/database/migrations/index.ts status
        ;;
    "new")
        echo "🆕 Creating new migration..."
        cd src/lib/database && mongo-migrate new $ADDITIONAL_ARGS
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "Usage: ./scripts/migrate.sh [build|up|down|status|new] [additional_args...]"
        echo ""
        echo "Examples:"
        echo "  ./scripts/migrate.sh down -l    # Rollback last migration"
        echo "  ./scripts/migrate.sh down -a    # Rollback all migrations"
        echo "  ./scripts/migrate.sh up         # Run all pending migrations"
        exit 1
        ;;
esac 