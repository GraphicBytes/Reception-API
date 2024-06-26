#!/bin/bash

while true; do
  echo " "
  echo " CLOUD RECEPTION API"
  echo "    SHELL TOOLS"
  echo " "
  branchName=$(git rev-parse --abbrev-ref HEAD)
  echo "Current Branch: $branchName"
  echo " "
  echo "Select an option:"
  echo " "
  echo "1. Cancel/Close"
  echo "2. Pull changes"
  echo "3. Start/Reboot docker container with dev.env"
  echo "4. Start/Reboot docker container with stage.env"
  echo "5. Start/Reboot docker container with production.env"
  echo "6. View console log output"
  echo "7. Git push changes to current branch"
  echo "8. Git merge Main to Staging"
  echo "9. Git merge Staging to Production"
  echo "10. Checkout Main branch"
  echo "11. Checkout Staging branch"
  echo "12. Checkout Production branch"
  echo "13. Shut down docker container"
  echo " "
  read -p "Enter option (1 to 13): " option

  case $option in
  1)
    echo " "
    echo "Operation cancelled. Bye Ó_ó"
    echo " "
    break
    ;;
  2)
    echo " "
    branchName=$(git rev-parse --abbrev-ref HEAD)
    echo "Current Branch: $branchName"
    echo " "
    echo "Pull all changes for this branch?"
    echo " "
    read -p "Confirm [y/n]: " confirmation
    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    else
      git reset --hard
      git pull --all
    fi
    ;;
  3)
    echo " "
    echo "Launch docker container into development environment? (dev.env)"
    read -p "Confirm [y/n]: " confirmation
    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    else
      docker-compose --env-file ./.env/dev.env down && docker-compose --env-file ./.env/dev.env up -d --build && docker image prune -f
    fi
    ;;
  4)
    echo " "
    echo "Launch docker container into staging environment? (stage.env)"
    read -p "Confirm [y/n]: " confirmation
    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    else
      docker-compose --env-file ./.env/stage.env down && docker-compose --env-file ./.env/stage.env up -d --build && docker image prune -f
    fi
    ;;
  5)
    echo " "
    echo "Launch docker container into production environment? (production.env)"
    read -p "Confirm [y/n]: " confirmation
    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    else
      docker-compose --env-file ./.env/production.env down && docker-compose --env-file ./.env/production.env up -d --build && docker image prune -f
    fi
    ;;
  6)
    echo " "
    docker logs reception-api -f
    ;;
  7)
    echo " "
    echo "Push changes to git?"
    branchName=$(git rev-parse --abbrev-ref HEAD)
    echo "Current Branch: $branchName"
    read -p "Confirm [y/n]: " confirmation

    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    else
      echo "Select an option for your commit message:"
      echo "1. Use default message ('Primary Dev Update')"
      echo "2. Enter a custom message"
      read -p "Enter option (1 or 2): " msgOption

      if [ "$msgOption" = "1" ]; then
        commitMessage="Primary Dev Update"
      elif [ "$msgOption" = "2" ]; then
        read -p "Enter your custom commit message: " customMessage
        commitMessage="$customMessage"
      else
        echo "Invalid option selected. Exiting."
        break
      fi

      git add --all
      git commit -m "$commitMessage"
      git push --all
    fi
    ;;
  8)
    echo " "
    echo "Merge Main branch to Staging?"
    read -p "Confirm [y/n]: " confirmation
    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    fi

    currentBranch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$currentBranch" != "Main" ]; then
      echo "You need to be on the Main branch to perform this action."
    else
      echo "Do you want to push current changes to Main before the merge to Staging?"
      read -p "Confirm [y/n]: " confirmPush
      if [ "$confirmPush" = "y" ]; then

        echo "Select an option for your commit message:"
        echo "1. Use default message ('Primary Dev Update')"
        echo "2. Enter a custom message"
        read -p "Enter option (1 or 2): " msgOption

        if [ "$msgOption" = "1" ]; then
          commitMessage="Primary Dev Update"
        elif [ "$msgOption" = "2" ]; then
          read -p "Enter your custom commit message: " customMessage
          commitMessage="$customMessage"
        else
          echo "Invalid option selected. Exiting."
          break
        fi

        git add --all
        git commit -m "$commitMessage"
        git push
      fi

      echo "Merging Main into Staging..."
      git checkout Staging
      git merge -X theirs Main
      git push origin Staging
      git checkout Main
    fi
    ;;
  9)
    echo " "
    echo "Merge Staging branch to Production?"
    read -p "Confirm [y/n]: " confirmation
    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    else
      echo "Merging Staging into Production..."
      git checkout Production
      git merge -X theirs Staging
      git push origin Production
      git checkout Main
    fi
    ;;
  10)
    echo " "
    git checkout Main
    ;;
  11)
    echo " "
    git checkout Staging
    ;;
  12)
    echo " "
    git checkout Production
    ;;
  13)
    echo " "
    echo "Shut down container?"
    read -p "Confirm [y/n]: " confirmation
    if [ "$confirmation" != "y" ]; then
      echo "Operation cancelled."
      continue
    else
      currentBranch=$(git rev-parse --abbrev-ref HEAD)
      if [ "$currentBranch" = "Main" ]; then
        docker-compose --env-file ./.env/dev.env down
      elif [ "$currentBranch" = "Staging" ];  then
        docker-compose --env-file .env/stage.env down
      elif [ "$currentBranch" = "Production" ];  then
        docker-compose --env-file .env/production.env down
      else
        echo " "
        echo "Must be in one of the 3 main git Branches."
        echo " "
        break
      fi
    fi
    ;;
  *)
    echo "Invalid option selected. Exiting."
    ;;
  esac
done
