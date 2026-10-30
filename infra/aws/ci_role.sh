#!/usr/bin/env bash
# Point the GitHub Actions deploy role (koboko-github-actions-deploy, assumed
# via OIDC from the production branch) at the EC2 host instead of ECS:
#   * an SSM document 'koboko-portfolio-deploy' that runs only koboko-deploy,
#   * the role may push to ECR (unchanged) and send *that* document to the
#     instance tagged Name=koboko-portfolio-host — no arbitrary shell access.
# Run after the cutover; it removes the role's ECS permissions.
#
#   bash infra/aws/ci_role.sh                  # dry run
#   DRY_RUN=false bash infra/aws/ci_role.sh    # apply

source "$(dirname "$0")/lib.sh"
require_identity

CI_ROLE="${CI_ROLE:-koboko-github-actions-deploy}"
DOC="$PREFIX-deploy"

step "SSM document $DOC"
if [[ -n "$(q ssm describe-document --name "$DOC" --query Document.Name)" ]]; then
    have "$DOC"
else
    plan "$DOC (runs /usr/local/bin/koboko-deploy, 10-minute timeout)"
    run aws ssm create-document --name "$DOC" --document-type Command --document-format JSON --tags "${TAGS_KV[@]}" \
        --content '{"schemaVersion":"2.2","description":"Pull, migrate and restart the portfolio backend","mainSteps":[{"action":"aws:runShellScript","name":"deploy","inputs":{"timeoutSeconds":"600","runCommand":["/usr/local/bin/koboko-deploy"]}}]}' >/dev/null
fi

step "Role $CI_ROLE"
change "policy koboko-deploy-permissions: ECR push (unchanged) + send $DOC to $HOST_NAME_TAG; ECS access removed"
run aws iam put-role-policy --role-name "$CI_ROLE" --policy-name koboko-deploy-permissions --policy-document "{
 \"Version\":\"2012-10-17\",\"Statement\":[
  {\"Sid\":\"ECRAuth\",\"Effect\":\"Allow\",\"Action\":\"ecr:GetAuthorizationToken\",\"Resource\":\"*\"},
  {\"Sid\":\"ECRPush\",\"Effect\":\"Allow\",\"Action\":[\"ecr:BatchCheckLayerAvailability\",\"ecr:PutImage\",
     \"ecr:InitiateLayerUpload\",\"ecr:UploadLayerPart\",\"ecr:CompleteLayerUpload\",\"ecr:BatchGetImage\"],
   \"Resource\":\"arn:aws:ecr:$AWS_REGION:$ACCOUNT_ID:repository/$ECR_REPO\"},
  {\"Sid\":\"FindHost\",\"Effect\":\"Allow\",\"Action\":\"ec2:DescribeInstances\",\"Resource\":\"*\"},
  {\"Sid\":\"DeployDocument\",\"Effect\":\"Allow\",\"Action\":\"ssm:SendCommand\",
   \"Resource\":\"arn:aws:ssm:$AWS_REGION:$ACCOUNT_ID:document/$DOC\"},
  {\"Sid\":\"DeployHost\",\"Effect\":\"Allow\",\"Action\":\"ssm:SendCommand\",
   \"Resource\":\"arn:aws:ec2:$AWS_REGION:$ACCOUNT_ID:instance/*\",
   \"Condition\":{\"StringEquals\":{\"aws:ResourceTag/Name\":\"$HOST_NAME_TAG\"}}},
  {\"Sid\":\"DeployResult\",\"Effect\":\"Allow\",\"Action\":[\"ssm:GetCommandInvocation\",\"ssm:ListCommandInvocations\"],\"Resource\":\"*\"}]}"

[[ "$DRY_RUN" == "true" ]] && log "   Dry run only — nothing was changed."
exit 0
