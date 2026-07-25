CREATE INDEX "evidence_project_updated_id_idx" ON "evidence" USING btree ("project_id","updated_at" DESC,"id" DESC);
